import json
import os
from django.conf import settings
from google import genai
from google.genai import types
from .schemas import RoadmapCopilotResponse
from .ai_client import GroqService
from .copilot_prompts import RoadmapCopilotPromptHelper

class RoadmapCopilotService(RoadmapCopilotPromptHelper):
    FALLBACK_MODELS = [
        'gemini-3-flash-preview',
        'gemini-2.5-flash-lite',
        'gemini-flash-latest',
    ]

    @classmethod
    def chat(cls, project, roadmap, prompt_text: str, conversation_history: list = None, active_phase_id: int = None, completed_task_ids: list = None, confirmed_decisions: list = None):
        completed_task_set = set(completed_task_ids or [])
        if confirmed_decisions is None:
            try:
                session = getattr(project, 'copilot_session', None)
                if session and session.confirmed_decisions:
                    confirmed_decisions = session.confirmed_decisions
            except Exception:
                confirmed_decisions = []
        confirmed_decisions = confirmed_decisions or []

        decisions_context = ""
        if confirmed_decisions:
            decisions_bullets = "\n".join([f"- {d}" for d in confirmed_decisions])
            decisions_context = (
                f"\nStrict Confirmed Architectural Constraints & Decisions (Authoritative Invariants):\n"
                f"{decisions_bullets}\n"
                f"Critical Continuity Mandate:\n"
                f"You MUST strictly preserve and adhere to these confirmed decisions across all turns.\n"
                f"- If Render was chosen for deployment, NEVER reintroduce AWS, S3, ECS, or Kubernetes.\n"
                f"- If monitoring or testing was excluded or avoided, NEVER reintroduce Prometheus, Grafana, Datadog, Jest, Cypress, or QA testing tasks.\n"
                f"- Treat confirmed decisions as inviolable constraints for this project unless the user explicitly requests changing them.\n"
            )

        phases_summary = []
        for phase in roadmap.phases.all().order_by('order'):
            m_list = []
            for m in phase.milestones.all().order_by('order'):
                t_list = []
                for t in m.tasks.all().order_by('order'):
                    t_list.append({
                        "id": t.id,
                        "title": t.title,
                        "description": t.description,
                        "is_completed": t.id in completed_task_set,
                    })
                m_list.append({
                    "id": m.id,
                    "title": m.title,
                    "description": m.description,
                    "order": m.order,
                    "tasks": t_list,
                })
            phases_summary.append({
                "id": phase.id,
                "order": phase.order,
                "title": phase.title,
                "duration": phase.duration,
                "description": phase.description,
                "milestones": m_list,
            })

        active_phase = None
        if active_phase_id:
            active_phase = roadmap.phases.filter(id=active_phase_id).first()

        active_phase_context = ""
        if active_phase:
            phase_tasks = [t for m in active_phase.milestones.all() for t in m.tasks.all()]
            completed_in_phase = [t.title for t in phase_tasks if t.id in completed_task_set]
            pending_in_phase = [t.title for t in phase_tasks if t.id not in completed_task_set]
            active_phase_context = (
                f"\nContext Phase (Currently Focused in UI):\n"
                f"- Phase ID: {active_phase.id}\n"
                f"- Phase Number (Order): {active_phase.order}\n"
                f"- Phase Title: {active_phase.title}\n"
                f"- Phase Description: {active_phase.description}\n"
                f"- Phase Duration: {active_phase.duration}\n"
                f"- Completed Tasks in this Phase ({len(completed_in_phase)}/{len(phase_tasks)}): {completed_in_phase}\n"
                f"- Pending Tasks in this Phase: {pending_in_phase}\n"
                f"Scope Rule: The user is focused on Phase {active_phase.order} ('{active_phase.title}'). Make ONLY the change the user explicitly requested. Do not analyze other phases or add unrequested changes.\n"
            )
        else:
            active_phase_context = (
                f"\nScope: 'All Phases' (Complete Roadmap Scope).\n"
                f"Scope Rule: Analyze all phases from top to bottom (Phase 1 through final phase) in roadmap dependency order. Identify relevant additions, edits, or deletions across the roadmap. Propose changes in roadmap order using action='update_roadmap' or 'update_tech_stack' (or 'add_phase' / 'delete_phase'). Preserve all unaffected phases, their IDs, order, and completed task statuses.\n"
            )

        system_instruction = (
            f"You are the Principal Software Architect and Technical Lead Copilot for DevPilot.\n"
            f"Project: '{project.name}'\n"
            f"Description: {project.description}\n"
            f"Current Tech Stack: {project.tech_stack or 'Modern Full-Stack'}\n"
            f"Requirements: {project.requirements or 'Standard production architecture'}\n\n"
            f"Current Roadmap Summary:\n"
            f"Roadmap Title: {roadmap.title}\n"
            f"Summary: {roadmap.summary}\n"
            f"Active Phases ({len(phases_summary)} total):\n"
            f"{json.dumps(phases_summary, indent=2)}\n"
            f"{active_phase_context}\n"
            f"{decisions_context}\n"
            f"Mandatory Architectural Change Workflow for ALL Requests:\n"
            f"CRITICAL RULE - MINIMAL SCOPE: Only make the EXACT change the user requested. NEVER add extra phases, tasks, or features beyond what the user explicitly asked for. If user asks for one new phase, add ONLY that one phase. Do not infer, suggest, or bundle extra changes.\n\n"
            f"1. Context & Roadmap Continuity:\n"
            f"   - Always inspect the current roadmap phases (Active Phases above) - check their exact titles, orders, and IDs before proposing anything.\n"
            f"   - Use the existing roadmap phase order and IDs shown above as the source of truth for context and ordering. Do not assume generic patterns about what should come first or last.\n"
            f"   - When splitting a phase:\n"
            f"     * Part 1 MUST update and replace the original phase (keeping its id and order).\n"
            f"     * Part 2 MUST be inserted immediately after (order + 1) with id: null.\n"
            f"     * NEVER keep the original unsplit phase alongside the split parts.\n"
            f"   - When removing a duplicate phase: return action='update_roadmap' with only the desired phases in 'affected_phases'.\n"
            f"   - When editing a phase: keep its exact id and order, update only what was asked.\n"
            f"2. Proposal Actions & Schema:\n"
            f"   - Single new phase addition ONLY: action='add_phase', operation='add_phase', phase_data=new phase (id: null).\n"
            f"   - Multi-phase changes (split, reorder, update multiple at once): action='update_roadmap', all affected phases in 'affected_phases'.\n"
            f"   - Single phase edit: action='edit_phase', target_phase_id=exact ID, target_phase_order=exact order, phase_data=updated phase.\n"
            f"   - Phase deletion: action='delete_phase', target_phase_id=exact ID, target_phase_order=exact order.\n"
            f"   - Tech stack migration: action='update_tech_stack', new_tech_stack=full updated string, include affected phases.\n"
            f"3. Explanation:\n"
            f"   - Write a clean 1-2 sentence summary of ONLY what is being changed.\n"
            f"   - Pure questions remain read-only: action='none', operation='explanation'.\n"
            f"4. Completed Tasks Preservation:\n"
            f"   - Strictly preserve completed task statuses (is_completed: true) for tasks that remain valid.\n"
            f"5. Architecture Source of Truth:\n"
            f"   - The current project tech stack and requirements are the authoritative source of truth.\n"
            f"   - For feature quotas or usage limits, design tasks to present an upgrade prompt with selectable plan tiers. Never imply automatic charging.\n"
            f"6. Return strictly JSON conforming to RoadmapCopilotResponse schema."
        )

        user_content = prompt_text
        if conversation_history:
            history_lines = []
            for item in conversation_history[-12:]:
                role = item.get('role', 'user')
                content = item.get('content', '')
                if content:
                    history_lines.append(f"{role}: {content}")
            if history_lines:
                user_content = f"Recent Conversation History:\n" + "\n".join(history_lines) + f"\n\nCurrent User Request: {prompt_text}"

        current_roadmap_version = str(roadmap.updated_at.isoformat()) if roadmap and roadmap.updated_at else None

        if GroqService.is_available():
            try:
                raw_json = GroqService.generate_json(
                    system_instruction,
                    user_content
                )
                normalized = cls._normalize_copilot_data(raw_json)
                resolved = cls._resolve_target_phase(roadmap, normalized, active_phase=active_phase, prompt_text=prompt_text)
                propagated = cls._apply_generic_roadmap_intent(roadmap, resolved, prompt_text=prompt_text, current_tech_stack=project.tech_stack)
                propagated['roadmap_version'] = current_roadmap_version
                validated = RoadmapCopilotResponse.model_validate(propagated)
                res_dict = validated.model_dump()
                res_dict['roadmap_version'] = current_roadmap_version
                return res_dict
            except Exception:
                pass

        api_key = getattr(settings, 'GEMINI_API_KEY', '') or ''
        if not api_key:
            raise ValueError("AI API key is not configured.")

        configured_model = getattr(settings, 'GEMINI_MODEL', 'gemini-3-flash-preview')
        models_to_try = [configured_model] + [m for m in cls.FALLBACK_MODELS if m != configured_model]

        client = genai.Client(api_key=api_key, http_options={'api_version': 'v1beta'})

        for model_name in models_to_try:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=system_instruction + "\n\n" + user_content,
                    config=types.GenerateContentConfig(
                        response_mime_type='application/json',
                        response_schema=RoadmapCopilotResponse,
                        temperature=0.2,
                    ),
                )
                raw = (response.text or '').strip()
                cleaned = json.loads(raw)
                normalized = cls._normalize_copilot_data(cleaned)
                resolved = cls._resolve_target_phase(roadmap, normalized, active_phase=active_phase, prompt_text=prompt_text)
                propagated = cls._apply_generic_roadmap_intent(roadmap, resolved, prompt_text=prompt_text, current_tech_stack=project.tech_stack)
                propagated['roadmap_version'] = current_roadmap_version
                validated = RoadmapCopilotResponse.model_validate(propagated)
                res_dict = validated.model_dump()
                res_dict['roadmap_version'] = current_roadmap_version
                return res_dict
            except Exception:
                continue

        raise RuntimeError("Failed to generate response from AI Roadmap Copilot.")
