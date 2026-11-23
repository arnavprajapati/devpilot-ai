import re
import json
import os
from django.conf import settings
from google import genai
from google.genai import types
from .schemas import GeneratedRoadmapSchema
from .ai_client import GroqService

class GeminiRoadmapService:
    FALLBACK_MODELS = [
        'gemini-3-flash-preview',
        'gemini-2.5-flash-lite',
        'gemini-flash-latest',
    ]

    @classmethod
    def get_api_key(cls):
        api_key = getattr(settings, 'GEMINI_API_KEY', '') or ''
        return api_key.strip()

    @classmethod
    def _build_prompt(cls, project):
        return (
            f"You are a Principal Software Architect. Generate a complete, production-grade engineering roadmap tailored specifically to the project scope, requirements, and tech stack.\n\n"
            f"Project Name: {project.name}\n"
            f"Description: {project.description}\n"
            f"Tech Stack: {project.tech_stack or 'Modern Full-Stack'}\n"
            f"Requirements: {project.requirements or 'Standard production architecture'}\n\n"
            f"Mandatory Phased Architecture Rules:\n"
            f"1. Generate a COMPLETE roadmap spanning as many distinct, chronological phases as the project needs (minimum 3 to 5 phases). Do NOT cram the entire project into Phase 1.\n"
            f"2. Strict Dependency Order across phases:\n"
            f"   - Phase 1 (Foundation & Core Infrastructure): ONLY setup, boilerplate, development environment, base database schema/migrations, and core configuration of the selected tech stack. NEVER put business features, QA, or deployment in Phase 1. Do NOT introduce tools or services missing from the selected tech stack.\n"
            f"   - Phase 2 (Core Features & Domain Logic): Primary application entities, core business workflows, API routes, and main user interactions.\n"
            f"   - Phase 3 (Advanced Features & Integrations): Secondary capabilities, third-party integrations, caching, message queues, real-time sync, and notifications.\n"
            f"   - Phase 4 (Security Auditing, Optimization & QA): End-to-end testing, security audits, vulnerability scans, caching optimizations, and load testing.\n"
            f"   - Phase 5 (CI/CD, Cloud Deployment & Launch): Build pipeline, container registry, cloud infrastructure provisioning, production deployment, and monitoring.\n"
            f"3. Each phase MUST have:\n"
            f"   - A distinct title reflecting its specific goal.\n"
            f"   - A realistic duration (e.g. '2 Weeks', '3 Weeks', '4 Weeks').\n"
            f"   - Sequential order (1, 2, 3, ...).\n"
            f"   - 2 to 3 focused milestones with actionable deliverables.\n"
            f"4. Under each milestone, provide 2 to 4 actionable tasks tailored specifically to '{project.name}' and its tech stack.\n"
            f"5. Architecture Source of Truth: The selected Tech Stack ('{project.tech_stack}') is the absolute source of truth. Every phase must remain architecturally consistent with this stack. Never propose unrequested migrations, cloud switches, or removals of core technologies in any phase.\n"
            f"6. Quota and Limit Rule: For storage quotas or usage limits (such as a 5 GB storage limit), design the UI and backend to present an upgrade prompt allowing the user to choose a plan. NEVER generate automatic purchases, auto-billing, or automatic upgrades without user plan choice.\n"
            f"7. No generic placeholders. Provide detailed, technical descriptions for every phase, milestone, and task."
        )

    @classmethod
    def _validate_roadmap_structure(cls, data):
        if not isinstance(data, dict):
            raise ValueError("Roadmap data must be a dictionary.")
        phases = data.get('phases')
        if not isinstance(phases, list) or len(phases) < 2:
            raise ValueError(f"Roadmap must contain at least 2 logical development phases, found {len(phases) if isinstance(phases, list) else 0}.")
        auto_pat = re.compile(r'\b(?:auto(?:matic(?:ally)?)?[- ]+(?:upgrade|purchase|billing|charge)|automatically[- ]+charge)\b', re.I)
        for idx, phase in enumerate(phases, start=1):
            if not isinstance(phase, dict):
                raise ValueError(f"Phase {idx} is invalid.")
            if not phase.get('title'):
                raise ValueError(f"Phase {idx} is missing a title.")
            milestones = phase.get('milestones', [])
            if not milestones or not isinstance(milestones, list):
                raise ValueError(f"Phase {idx} ('{phase.get('title')}') has no milestones.")
            has_tasks = any(m.get('tasks') for m in milestones if isinstance(m, dict))
            if not has_tasks:
                raise ValueError(f"Phase {idx} ('{phase.get('title')}') has no actionable tasks.")
            for m in milestones:
                if isinstance(m, dict):
                    for t in m.get('tasks', []):
                        if isinstance(t, dict):
                            t_title = t.get('title', '')
                            t_desc = t.get('description', '')
                            if auto_pat.search(t_title):
                                t['title'] = auto_pat.sub('prompt upgrade and plan selection', t_title)
                            if auto_pat.search(t_desc):
                                t['description'] = auto_pat.sub('prompt user with upgrade modal and plan options', t_desc)
        return data

    @classmethod
    def _parse_response(cls, raw_text):
        raw_text = raw_text.strip()
        try:
            validated = GeneratedRoadmapSchema.model_validate_json(raw_text)
            dumped = validated.model_dump()
        except Exception:
            cleaned = raw_text
            for prefix in ('```json', '```'):
                if cleaned.startswith(prefix):
                    cleaned = cleaned[len(prefix):]
            if cleaned.endswith('```'):
                cleaned = cleaned[:-3]
            parsed = json.loads(cleaned.strip())
            validated = GeneratedRoadmapSchema.model_validate(parsed)
            dumped = validated.model_dump()
        return cls._validate_roadmap_structure(dumped)

    @classmethod
    def generate_roadmap(cls, project):
        if GroqService.is_available():
            try:
                system_instruction = (
                    "You are a Principal Software Architect. Generate a production-grade engineering roadmap tailored specifically to the project scope and complexity. "
                    "Split work into ordered logical phases (minimum 3 to 5 phases). Phase 1 is strictly foundation and infrastructure. Later phases must cover core features, integrations, security, and deployment in dependency order. Do not cram everything into Phase 1. "
                    "The selected tech stack and requirements are the authoritative source of truth. Do not introduce tools missing from the tech stack or unrequested migrations. For storage limits or quotas, always prompt for plan selection rather than automatic upgrades. "
                    "Output valid JSON matching this schema: title (str), summary (str), and phases (list of phases each with phase_number (int), title (str), description (str), duration (str), milestones (list of milestones each with title (str), description (str), order (int), tasks (list of tasks each with title (str), description (str), order (int))))."
                )
                prompt = cls._build_prompt(project)
                raw_json = GroqService.generate_json(system_instruction, prompt)
                validated = GeneratedRoadmapSchema.model_validate(raw_json)
                return cls._validate_roadmap_structure(validated.model_dump())
            except Exception:
                pass

        api_key = cls.get_api_key()
        if not api_key:
            raise ValueError("AI API key is not configured.")

        configured_model = getattr(settings, 'GEMINI_MODEL', 'gemini-3-flash-preview')
        models_to_try = [configured_model] + [m for m in cls.FALLBACK_MODELS if m != configured_model]

        client = genai.Client(api_key=api_key, http_options={'api_version': 'v1beta'})
        prompt = cls._build_prompt(project)

        last_error = None
        for model_name in models_to_try:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type='application/json',
                        response_schema=GeneratedRoadmapSchema,
                        temperature=0.2,
                        max_output_tokens=8192,
                    ),
                )
                raw_text = response.text or ''
                if not raw_text.strip():
                    last_error = RuntimeError(f"Model {model_name} returned empty response.")
                    continue
                return cls._parse_response(raw_text)
            except Exception as exc:
                last_error = exc
                continue

        raise RuntimeError(
            f"All AI models unavailable. Last error: {last_error}"
        )


