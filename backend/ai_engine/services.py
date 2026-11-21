import os
import re
import json
import requests
from django.conf import settings
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List, Optional, Literal


class GeneratedTaskSchema(BaseModel):
    id: Optional[int] = Field(default=None, description="Stable database ID of task")
    title: str = Field(description="Actionable task title")
    description: str = Field(default="", description="One-sentence implementation note")
    order: int = Field(default=1)
    is_completed: Optional[bool] = Field(default=None, description="Completion status")


class GeneratedMilestoneSchema(BaseModel):
    id: Optional[int] = Field(default=None, description="Stable database ID of milestone")
    title: str = Field(description="Milestone deliverable title")
    description: str = Field(default="", description="One-sentence deliverable objective")
    order: int = Field(default=1)
    tasks: List[GeneratedTaskSchema] = Field(default_factory=list, description="Actionable tasks")


class GeneratedPhaseSchema(BaseModel):
    id: Optional[int] = Field(default=None, description="Stable database ID of phase")
    title: str = Field(description="Phase title")
    description: str = Field(default="", description="One-sentence phase goal")
    duration: str = Field(default="2 Weeks", description="Duration e.g. Weeks 1-3")
    order: Optional[int] = Field(default=None, description="Phase order e.g. 1, 2, 3")
    milestones: List[GeneratedMilestoneSchema] = Field(default_factory=list, description="Milestones per phase")


class GeneratedRoadmapSchema(BaseModel):
    title: str = Field(description="Roadmap title")
    summary: str = Field(description="Executive summary of the technical plan")
    phases: List[GeneratedPhaseSchema] = Field(description="Dynamic list of development phases based on project scope")


class RoadmapCopilotResponse(BaseModel):
    explanation: str = Field(default="", description="Helpful, conversational explanation of architecture, use cases, and changes.")
    action: Literal["none", "add_phase", "edit_phase", "delete_phase", "update_tech_stack", "update_roadmap"] = Field(default="none", description="Action type: none, add_phase, edit_phase, delete_phase, update_tech_stack, update_roadmap")
    operation: Optional[Literal["explanation", "clarification", "add_task", "edit_task", "remove_task", "add_phase", "edit_phase", "delete_phase", "update_tech_stack", "update_roadmap"]] = Field(default=None, description="Specific structured operation")
    phase_data: Optional[GeneratedPhaseSchema] = Field(default=None, description="New or edited phase details when action is add_phase or edit_phase")
    target_phase_id: Optional[int] = Field(default=None, description="Database ID of target phase being edited or deleted")
    target_phase_order: Optional[int] = Field(default=None, description="Phase order/number of target phase being edited or deleted")
    target_task_ids: Optional[List[int]] = Field(default=None, description="List of target task IDs affected or removed")
    changed_fields: Optional[List[str]] = Field(default=None, description="Names of fields changed")
    reason: Optional[str] = Field(default=None, description="Technical reason for the change")
    new_tech_stack: Optional[str] = Field(default=None, description="Updated tech stack when action is update_tech_stack")
    affected_phases: Optional[List[GeneratedPhaseSchema]] = Field(default=None, description="List of updated phases when action is update_tech_stack or update_roadmap")
    change_summary: Optional[str] = Field(default=None, description="Clear summary of proposed changes before user accepts")
    impact_on_completed_tasks: Optional[str] = Field(default=None, description="Impact explanation on completed tasks")


class GeneratedColumnSchema(BaseModel):
    name: str = Field(description="Column or field name")
    data_type: str = Field(description="Data type e.g. UUID, VARCHAR(255), INTEGER, TIMESTAMP, ObjectId, String, Array")
    is_primary: bool = Field(default=False, description="Whether this is a primary key")
    is_foreign: bool = Field(default=False, description="Whether this is a foreign key")
    references: str = Field(default="", description="Target table and column e.g. users.id")
    is_unique: bool = Field(default=False, description="Whether this has a unique constraint")
    is_nullable: bool = Field(default=False, description="Whether this allows null values")


class GeneratedTableSchema(BaseModel):
    name: str = Field(description="Table or collection name in snake_case e.g. users, orders")
    description: str = Field(description="Brief explanation of entity role")
    columns: List[GeneratedColumnSchema] = Field(description="List of columns or document fields")


class GeneratedRelationshipSchema(BaseModel):
    source_table: str = Field(description="Source table name e.g. profiles, orders")
    target_table: str = Field(description="Target table name e.g. users")
    relationship_type: str = Field(default="1:N", description="'1:1', '1:N', or 'N:M'")
    foreign_key_column: str = Field(default="", description="The foreign key column name e.g. user_id")


class GeneratedEntityPromptResponse(BaseModel):
    explanation: str = Field(default="", description="Conversational, natural answer and explanation like an expert AI assistant explaining the architecture, answering user questions, or detailing what was modified.")
    primary_entity: GeneratedTableSchema = Field(description="The primary table or collection being edited or created")
    new_related_entities: List[GeneratedTableSchema] = Field(default_factory=list, description="Any new related tables or collections created to fulfill the prompt")
    relationships: List[GeneratedRelationshipSchema] = Field(default_factory=list, description="Connections between primary_entity and new_related_entities or other tables")


class GeneratedDBSchema(BaseModel):
    schema_type: str = Field(description="'table' for SQL or 'document' for NoSQL")
    db_engine: str = Field(description="e.g. PostgreSQL, MySQL, SQLite, MongoDB")
    tables: List[GeneratedTableSchema] = Field(description="List of database tables or document collections")
    sql_ddl: str = Field(default="", description="Ready-to-execute SQL CREATE TABLE statements")
    nosql_code: str = Field(default="", description="Mongoose or Prisma Schema representation")


class GroqService:
    API_URL = "https://api.groq.com/openai/v1/chat/completions"
    MODELS = [
        "qwen/qwen3.8-27b",
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
    ]

    @classmethod
    def get_api_key(cls):
        api_key = (
            getattr(settings, 'GROQ_API_KEY', '') or
            os.environ.get('GROQ_API_KEY', '') or
            ''
        )
        return api_key.strip()

    @classmethod
    def is_available(cls):
        key = cls.get_api_key()
        return bool(key and key.startswith('gsk_'))

    @classmethod
    def generate_json(cls, system_prompt: str, user_prompt: str, timeout: int = 15):
        api_key = cls.get_api_key()
        if not api_key:
            raise ValueError("Groq API key is not configured.")

        configured_model = getattr(settings, 'GROQ_MODEL', 'qwen/qwen3.8-27b')
        models_to_try = [configured_model] + [m for m in cls.MODELS if m != configured_model]

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        last_error = None
        for model_name in models_to_try:
            payload = {
                "model": model_name,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.2,
            }
            try:
                resp = requests.post(cls.API_URL, headers=headers, json=payload, timeout=timeout)
                if resp.status_code == 200:
                    data = resp.json()
                    if not isinstance(data, dict) or "choices" not in data or not data["choices"]:
                        last_error = RuntimeError(f"Model {model_name} returned malformed response structure.")
                        continue
                    message = data["choices"][0].get("message", {})
                    content = message.get("content", "")
                    if not content or not content.strip():
                        last_error = RuntimeError(f"Model {model_name} returned empty content.")
                        continue
                    cleaned = content.strip()
                    for prefix in ("```json", "```"):
                        if cleaned.startswith(prefix):
                            cleaned = cleaned[len(prefix):]
                    if cleaned.endswith("```"):
                        cleaned = cleaned[:-3]
                    parsed = json.loads(cleaned.strip())
                    if not isinstance(parsed, dict) or not parsed:
                        last_error = RuntimeError(f"Model {model_name} returned invalid or empty JSON.")
                        continue
                    return parsed
                else:
                    last_error = RuntimeError(f"Groq API error ({resp.status_code}): {resp.text}")
            except Exception as exc:
                last_error = exc
                continue

        if last_error:
            raise last_error
        raise RuntimeError("Failed to generate response from Groq.")


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
            f"   - Phase 1 (Foundation & Core Infrastructure): ONLY setup, boilerplate, development environment, base database schema/migrations, and core configuration. NEVER put business features, QA, or deployment in Phase 1.\n"
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
            f"5. No generic placeholders. Provide detailed, technical descriptions for every phase, milestone, and task."
        )

    @classmethod
    def _validate_roadmap_structure(cls, data):
        if not isinstance(data, dict):
            raise ValueError("Roadmap data must be a dictionary.")
        phases = data.get('phases')
        if not isinstance(phases, list) or len(phases) < 3:
            raise ValueError(f"Roadmap must contain at least 3 logical development phases, found {len(phases) if isinstance(phases, list) else 0}.")
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


class WhiteboardService:
    @classmethod
    def build_nodes_and_edges(cls, roadmap):
        nodes = []
        edges = []
        current_x = 80
        base_y = 260

        phases = list(roadmap.phases.prefetch_related('milestones__tasks').all())

        for p_idx, phase in enumerate(phases):
            phase_node_id = f"phase-{phase.id}"
            nodes.append({
                "id": phase_node_id,
                "type": "phaseNode",
                "position": {"x": current_x, "y": base_y},
                "data": {
                    "label": phase.title,
                    "title": phase.title,
                    "description": phase.description,
                    "duration": phase.duration,
                    "order": phase.order,
                    "nodeType": "phase",
                    "phaseId": phase.id,
                },
            })

            pending_sources = [phase_node_id]
            cursor_x = current_x + 360

            milestones = list(phase.milestones.all())
            for milestone in milestones:
                milestone_node_id = f"milestone-{milestone.id}"
                nodes.append({
                    "id": milestone_node_id,
                    "type": "milestoneNode",
                    "position": {"x": cursor_x, "y": base_y},
                    "data": {
                        "label": milestone.title,
                        "title": milestone.title,
                        "description": milestone.description,
                        "order": milestone.order,
                        "nodeType": "milestone",
                        "phaseId": phase.id,
                        "milestoneId": milestone.id,
                    },
                })

                for src_id in pending_sources:
                    edges.append({
                        "id": f"e-{src_id}-{milestone_node_id}",
                        "source": src_id,
                        "target": milestone_node_id,
                        "type": "smoothstep",
                        "animated": src_id == phase_node_id,
                    })

                tasks = list(milestone.tasks.all())
                num_tasks = len(tasks)

                if num_tasks > 0:
                    task_cursor_x = cursor_x + 360
                    start_y = base_y - ((num_tasks - 1) * 75)
                    task_node_ids = []
                    for t_idx, task in enumerate(tasks):
                        task_node_id = f"task-{task.id}"
                        task_y = start_y + (t_idx * 150)
                        nodes.append({
                            "id": task_node_id,
                            "type": "taskNode",
                            "position": {"x": task_cursor_x, "y": task_y},
                            "data": {
                                "label": task.title,
                                "title": task.title,
                                "description": task.description,
                                "order": task.order,
                                "nodeType": "task",
                                "phaseId": phase.id,
                                "milestoneId": milestone.id,
                            },
                        })
                        edges.append({
                            "id": f"e-{milestone_node_id}-{task_node_id}",
                            "source": milestone_node_id,
                            "target": task_node_id,
                            "type": "smoothstep",
                        })
                        task_node_ids.append(task_node_id)
                    cursor_x = task_cursor_x + 340
                    pending_sources = task_node_ids
                else:
                    cursor_x += 360
                    pending_sources = [milestone_node_id]

            decision_node_id = f"decision-phase-{phase.id}"
            decision_x = cursor_x + 40
            nodes.append({
                "id": decision_node_id,
                "type": "decisionNode",
                "position": {"x": decision_x, "y": base_y},
                "data": {
                    "label": f"Phase {phase.order} Review Gate",
                    "title": f"Phase {phase.order} Review Gate",
                    "description": f"Verify all {phase.title} deliverables before proceeding.",
                    "nodeType": "decision",
                    "phaseId": phase.id,
                },
            })

            for src_id in pending_sources:
                edges.append({
                    "id": f"e-{src_id}-{decision_node_id}",
                    "source": src_id,
                    "target": decision_node_id,
                    "type": "smoothstep",
                })

            if p_idx < len(phases) - 1:
                next_phase = phases[p_idx + 1]
                next_phase_node_id = f"phase-{next_phase.id}"
                current_x = decision_x + 380
                edges.append({
                    "id": f"e-{decision_node_id}-{next_phase_node_id}",
                    "source": decision_node_id,
                    "target": next_phase_node_id,
                    "type": "smoothstep",
                    "animated": True,
                    "label": "Approved",
                })
            else:
                current_x = decision_x + 380

        return nodes, edges

    @classmethod
    def generate_initial_whiteboard(cls, roadmap):
        from .models import RoadmapWhiteboard
        nodes, edges = cls.build_nodes_and_edges(roadmap)
        whiteboard, _ = RoadmapWhiteboard.objects.update_or_create(
            roadmap=roadmap,
            defaults={
                "nodes": nodes,
                "edges": edges,
                "viewport": {"x": 0, "y": 0, "zoom": 1},
                "is_customized": False,
            },
        )
        return whiteboard


class DatabaseSchemaService:
    FALLBACK_MODELS = [
        'gemini-3-flash-preview',
        'gemini-2.5-flash-lite',
        'gemini-flash-latest',
    ]

    @classmethod
    def detect_schema_type(cls, project):
        stack = (project.tech_stack or '').lower()
        if 'mongo' in stack or 'nosql' in stack or 'document' in stack or 'firestore' in stack or 'dynamo' in stack:
            return 'document', 'MongoDB'
        if 'mysql' in stack:
            return 'table', 'MySQL'
        if 'sqlite' in stack:
            return 'table', 'SQLite'
        return 'table', 'PostgreSQL'

    @classmethod
    def _build_prompt(cls, project, schema_type, db_engine):
        if schema_type == 'document':
            return (
                f"You are a Principal Database Architect.\n"
                f"Design a production-grade NoSQL Document schema for:\n"
                f"Project: {project.name}\n"
                f"Description: {project.description}\n"
                f"Tech Stack: {project.tech_stack or 'Node.js, Express, MongoDB'}\n"
                f"Requirements: {project.requirements or 'Standard production architecture'}\n\n"
                f"Rules:\n"
                f"- db_engine: '{db_engine}'\n"
                f"- schema_type: 'document'\n"
                f"- Create 4 to 6 core collections (e.g. users, orders, products, etc.).\n"
                f"- Each collection has 4 to 8 fields with clean types (e.g. ObjectId, String, Number, Boolean, Array<String>, Object).\n"
                f"- If a field references another collection, set is_foreign: true and references: '<TargetCollection>._id'.\n"
                f"- Provide clean Mongoose / TypeScript schema code in nosql_code.\n"
                f"- Leave sql_ddl empty."
            )
        return (
            f"You are a Principal Database Architect.\n"
            f"Design a normalized, production-grade Relational SQL schema for:\n"
            f"Project: {project.name}\n"
            f"Description: {project.description}\n"
            f"Tech Stack: {project.tech_stack or 'React, Django, PostgreSQL'}\n"
            f"Requirements: {project.requirements or 'Standard production architecture'}\n\n"
            f"Rules:\n"
            f"- db_engine: '{db_engine}'\n"
            f"- schema_type: 'table'\n"
            f"- Create 4 to 6 normalized tables (e.g. users, projects, tasks, etc.).\n"
            f"- Each table has 4 to 8 columns with standard SQL data types (e.g. UUID, VARCHAR(255), INTEGER, TIMESTAMP, BOOLEAN, TEXT).\n"
            f"- Specify is_primary: true on primary keys.\n"
            f"- Specify is_foreign: true and references: '<target_table>.id' on foreign keys.\n"
            f"- Provide valid, runnable SQL CREATE TABLE statements with constraints in sql_ddl.\n"
            f"- Leave nosql_code empty."
        )

    @classmethod
    def _parse_response(cls, raw_text):
        raw_text = raw_text.strip()
        try:
            validated = GeneratedDBSchema.model_validate_json(raw_text)
            return validated.model_dump()
        except Exception:
            cleaned = raw_text
            for prefix in ('```json', '```'):
                if cleaned.startswith(prefix):
                    cleaned = cleaned[len(prefix):]
            if cleaned.endswith('```'):
                cleaned = cleaned[:-3]
            parsed = json.loads(cleaned.strip())
            validated = GeneratedDBSchema.model_validate(parsed)
            return validated.model_dump()

    @classmethod
    def generate_schema_data(cls, project, forced_type=None):
        detected_type, default_engine = cls.detect_schema_type(project)
        schema_type = forced_type if forced_type in ['table', 'document'] else detected_type
        db_engine = 'MongoDB' if schema_type == 'document' else ('PostgreSQL' if default_engine == 'MongoDB' else default_engine)

        prompt = cls._build_prompt(project, schema_type, db_engine)

        if GroqService.is_available():
            try:
                system_instruction = (
                    f"You are a Principal Database Architect.\n"
                    f"Generate a production-ready database schema for {project.name}.\n"
                    f"Rules:\n"
                    f"- Return valid JSON matching GeneratedDBSchema: schema_type ('{schema_type}'), db_engine ('{db_engine}'), tables (array of 4 to 7 tables with name, description, columns with name, data_type, is_primary, is_foreign, references, is_unique, is_nullable), sql_ddl, nosql_code."
                )
                raw_json = GroqService.generate_json(system_instruction, prompt)
                validated = GeneratedDBSchema.model_validate(raw_json)
                gen_schema_type = str(validated.schema_type or '').strip().lower()
                gen_db_engine = str(validated.db_engine or '').strip().lower()
                if gen_schema_type != schema_type.lower() or gen_db_engine != db_engine.lower():
                    raise ValueError(f"Generated schema targeted wrong engine: {validated.db_engine} ({validated.schema_type}), expected {db_engine} ({schema_type})")
                if schema_type == 'table' and not (validated.sql_ddl or '').strip():
                    raise ValueError("Generated relational schema is missing sql_ddl.")
                if schema_type == 'document' and not (validated.nosql_code or '').strip():
                    raise ValueError("Generated document schema is missing nosql_code.")
                return validated.model_dump()
            except Exception:
                pass

        api_key = getattr(settings, 'GEMINI_API_KEY', '') or ''
        if not api_key:
            raise ValueError("AI API key is not configured.")

        configured_model = getattr(settings, 'GEMINI_MODEL', 'gemini-3-flash-preview')
        models_to_try = [configured_model] + [m for m in cls.FALLBACK_MODELS if m != configured_model]

        client = genai.Client(api_key=api_key, http_options={'api_version': 'v1beta'})
        prompt = cls._build_prompt(project, schema_type, db_engine)

        last_error = None
        for model_name in models_to_try:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type='application/json',
                        response_schema=GeneratedDBSchema,
                        temperature=0.2,
                        max_output_tokens=3072,
                    ),
                )
                raw_text = response.text or ''
                if not raw_text.strip():
                    last_error = RuntimeError(f"Model {model_name} returned empty response.")
                    continue
                data = cls._parse_response(raw_text)
                gen_schema_type = str(data.get('schema_type', '')).strip().lower()
                gen_db_engine = str(data.get('db_engine', '')).strip().lower()
                if gen_schema_type != schema_type.lower() or gen_db_engine != db_engine.lower():
                    last_error = ValueError(f"Model {model_name} targeted wrong engine: {data.get('db_engine')} ({data.get('schema_type')}), expected {db_engine} ({schema_type})")
                    continue
                if schema_type == 'table' and not (data.get('sql_ddl') or '').strip():
                    last_error = ValueError(f"Model {model_name} generated relational schema missing sql_ddl.")
                    continue
                if schema_type == 'document' and not (data.get('nosql_code') or '').strip():
                    last_error = ValueError(f"Model {model_name} generated document schema missing nosql_code.")
                    continue
                return data
            except Exception as exc:
                last_error = exc
                continue

        raise RuntimeError(f"Database schema generation unavailable. Last error: {last_error}")

    @classmethod
    def build_layout(cls, schema_type, tables, db_engine):
        seen_entity_names = set()
        for idx, table in enumerate(tables):
            name = (table.get('name') or '').strip()
            if not name:
                continue
            name_lower = name.lower()
            if name_lower in seen_entity_names:
                raise ValueError(f"Duplicate entity name detected: '{name}'. Entity names must be unique.")
            seen_entity_names.add(name_lower)

        nodes = []
        edges = []
        cols = 3 if len(tables) >= 5 else 2
        col_width = 460
        row_height = 430

        node_type = 'tableNode' if schema_type == 'table' else 'documentNode'

        for idx, table in enumerate(tables):
            c = idx % cols
            r = idx // cols
            pos_x = c * col_width + 80
            pos_y = r * row_height + 80

            table_name = table.get('name', f'entity_{idx+1}')
            node_id = f"db-{table_name}"

            nodes.append({
                "id": node_id,
                "type": node_type,
                "position": {"x": pos_x, "y": pos_y},
                "data": {
                    "name": table_name,
                    "description": table.get('description', ''),
                    "columns": table.get('columns', []),
                    "schemaType": schema_type,
                    "dbEngine": db_engine,
                },
            })

        for table in tables:
            source_table_name = table.get('name', '')
            source_node_id = f"db-{source_table_name}"
            for col in table.get('columns', []):
                if col.get('is_foreign') and col.get('references'):
                    ref = col.get('references', '')
                    target_table_name = ref.split('.')[0].strip()
                    target_node_id = f"db-{target_table_name}"
                    if any(t.get('name') == target_table_name for t in tables):
                        edge_id = f"e-fk-{source_table_name}-{target_table_name}-{col.get('name')}"
                        edges.append({
                            "id": edge_id,
                            "source": source_node_id,
                            "target": target_node_id,
                            "type": "smoothstep",
                            "animated": True,
                            "label": f"FK: {col.get('name')}",
                        })

        return nodes, edges

    @classmethod
    def generate_entity_from_prompt(cls, prompt_text, schema_type='table', db_engine='PostgreSQL', current_entity=None, project=None):
        context = ""
        if current_entity:
            context += f"Current entity: name='{current_entity.get('name')}', description='{current_entity.get('description')}', columns={json.dumps(current_entity.get('columns', []))}\n"
        if project:
            context += f"Project: {project.name}, Tech Stack: {project.tech_stack or ''}\n"

        system_instruction = (
            f"You are DevPilot AI, a Principal Database Architect & Engineering Copilot chatbot.\n"
            f"You are actively having a conversation with the user about this database {schema_type} ('table' or 'document') for {db_engine}.\n"
            f"{context}\n"
            f"User Message: {prompt_text}\n\n"
            f"Instructions:\n"
            f"- Output valid JSON matching GeneratedEntityPromptResponse schema.\n"
            f"- explanation: Speak conversationally like a knowledgeable, helpful chatbot! Directly answer any questions the user asked (for instance, explain what tables or fields are for, how they work together, why they were designed, or answer any technical query). If changes or new tables were requested, explain what was created and why.\n"
            f"- primary_entity: The entity currently being edited ({current_entity.get('name') if current_entity else 'entity'}). Keep its existing columns intact unless the user explicitly asked to change or add columns to it.\n"
            f"- new_related_entities: If the user asked to create or connect a new table/collection, define the full new entities here. If no new tables were asked for, keep this list empty [].\n"
            f"- relationships: Define foreign key connections (source_table, target_table, relationship_type, foreign_key_column) between primary_entity and any new_related_entities or existing tables.\n"
            f"- For SQL ({db_engine}): data types like UUID, VARCHAR(255), INTEGER, TIMESTAMP, BOOLEAN, TEXT, DECIMAL(10,2).\n"
            f"- For NoSQL ({db_engine}): data types like ObjectId, String, Number, Boolean, Date, Array<String>, Object.\n"
            f"- Accurately specify is_primary, is_foreign, references, is_nullable, is_unique."
        )

        if GroqService.is_available():
            try:
                raw_json = GroqService.generate_json(
                    system_instruction,
                    f"Design entity based on prompt: {prompt_text}"
                )
                validated = GeneratedEntityPromptResponse.model_validate(raw_json)
                return validated.model_dump()
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
                    contents=system_instruction,
                    config=types.GenerateContentConfig(
                        response_mime_type='application/json',
                        response_schema=GeneratedEntityPromptResponse,
                        temperature=0.2,
                    ),
                )
                raw = (response.text or '').strip()
                validated = GeneratedEntityPromptResponse.model_validate_json(raw)
                return validated.model_dump()
            except Exception:
                continue

        raise RuntimeError("Failed to generate entity from prompt.")


class RoadmapCopilotService:
    FALLBACK_MODELS = [
        'gemini-3-flash-preview',
        'gemini-2.5-flash-lite',
        'gemini-flash-latest',
    ]

    @classmethod
    def _normalize_copilot_data(cls, data):
        if not isinstance(data, dict):
            return data
        if 'explanation' not in data and 'message' in data:
            data['explanation'] = str(data['message'])
        elif 'explanation' not in data:
            data['explanation'] = 'Here is the requested roadmap architectural proposal.'
        valid_actions = {'none', 'add_phase', 'edit_phase', 'delete_phase', 'update_tech_stack', 'update_roadmap'}
        if data.get('action') not in valid_actions:
            data['action'] = 'none'

        if not data.get('operation'):
            action_to_op = {
                'none': 'explanation',
                'add_phase': 'add_phase',
                'edit_phase': 'edit_phase',
                'delete_phase': 'delete_phase',
                'update_tech_stack': 'update_tech_stack',
                'update_roadmap': 'update_roadmap',
            }
            data['operation'] = action_to_op.get(data.get('action'), 'explanation')

        def _norm_single_phase(p, default_idx=None):
            if not isinstance(p, dict):
                return p
            if 'id' in p and p['id'] is not None:
                try:
                    p['id'] = int(p['id'])
                except (ValueError, TypeError):
                    p['id'] = None
            if not p.get('description'):
                p_title = p.get('title', 'Development Phase')
                p['description'] = f"Comprehensive architecture and implementation for {p_title}."
            if 'order' in p and p['order'] is not None:
                try:
                    p['order'] = int(p['order'])
                except (ValueError, TypeError):
                    p['order'] = default_idx
            else:
                p['order'] = default_idx
            milestones = p.get('milestones', [])
            for m_idx, m in enumerate(milestones, start=1):
                if isinstance(m, dict):
                    if 'id' in m and m['id'] is not None:
                        try:
                            m['id'] = int(m['id'])
                        except (ValueError, TypeError):
                            m['id'] = None
                    m_title = m.get('title') or f"Milestone {m_idx}"
                    if not m.get('description'):
                        m['description'] = f"Deliver and validate core components for {m_title}."
                    raw_tasks = m.get('tasks', [])
                    norm_tasks = []
                    for t_idx, t in enumerate(raw_tasks, start=1):
                        if isinstance(t, str):
                            t_title = t.strip()
                            t_desc = f"Implement and configure {t_title}."
                            norm_tasks.append({'id': None, 'title': t_title, 'description': t_desc, 'order': t_idx, 'is_completed': None})
                        elif isinstance(t, dict):
                            t_id = None
                            if 'id' in t and t['id'] is not None:
                                try:
                                    t_id = int(t['id'])
                                except (ValueError, TypeError):
                                    t_id = None
                            t_title = t.get('title') or t.get('name') or f'Task {t_idx}'
                            t_desc = (t.get('description') or '').strip()
                            if not t_desc:
                                t_desc = f"Implement and verify {t_title}."
                            norm_tasks.append({
                                'id': t_id,
                                'title': t_title,
                                'description': t_desc,
                                'order': t.get('order', t_idx),
                                'is_completed': t.get('is_completed'),
                            })
                    m['tasks'] = norm_tasks
                    if 'order' not in m:
                        m['order'] = m_idx
            return p

        phase = data.get('phase_data')
        if isinstance(phase, dict):
            data['phase_data'] = _norm_single_phase(phase)

        affected = data.get('affected_phases')
        if isinstance(affected, list):
            data['affected_phases'] = [_norm_single_phase(p, idx) for idx, p in enumerate(affected, start=1)]

        return data

    @classmethod
    def _resolve_target_phase(cls, roadmap, data, active_phase=None, prompt_text=""):
        if not isinstance(data, dict):
            return data
        action = data.get('action')
        if action in ['edit_phase', 'delete_phase']:
            target_phase = None
            target_id = data.get('target_phase_id')
            target_order = data.get('target_phase_order')
            phase_data = data.get('phase_data') or {}
            phase_title = (phase_data.get('title') or '').strip().lower()

            prompt_phase_match = re.search(r'\bphase\s*(\d+)\b', prompt_text or '', re.IGNORECASE)
            if prompt_phase_match:
                try:
                    p_num = int(prompt_phase_match.group(1))
                    target_phase = roadmap.phases.filter(order=p_num).first()
                except (ValueError, TypeError):
                    pass

            if not target_phase and target_order:
                try:
                    target_phase = roadmap.phases.filter(order=int(target_order)).first()
                except (ValueError, TypeError):
                    pass

            if not target_phase and target_id:
                try:
                    target_phase = roadmap.phases.filter(id=int(target_id)).first()
                except (ValueError, TypeError):
                    pass

            if not target_phase and phase_title:
                target_phase = roadmap.phases.filter(title__iexact=phase_title).first()

            if not target_phase and active_phase:
                target_phase = active_phase

            if target_phase:
                data['target_phase_id'] = target_phase.id
                data['target_phase_order'] = target_phase.order
                if isinstance(data.get('phase_data'), dict):
                    data['phase_data']['order'] = target_phase.order

        elif action in ['update_roadmap', 'update_tech_stack']:
            affected = data.get('affected_phases')
            if isinstance(affected, list):
                for p in affected:
                    if isinstance(p, dict):
                        p_order = p.get('order')
                        p_title = (p.get('title') or '').strip().lower()
                        p_id = p.get('id')
                        matched = None
                        if p_id:
                            try:
                                matched = roadmap.phases.filter(id=int(p_id)).first()
                            except (ValueError, TypeError):
                                pass
                        if not matched and p_order:
                            try:
                                matched = roadmap.phases.filter(order=int(p_order)).first()
                            except (ValueError, TypeError):
                                pass
                        if not matched and p_title:
                            matched = roadmap.phases.filter(title__iexact=p_title).first()
                        if matched:
                            p['id'] = matched.id
                            p['target_phase_id'] = matched.id
                            p['order'] = matched.order

        return data

    @classmethod
    def _is_explanation_request(cls, prompt_text: str):
        text = (prompt_text or "").strip().lower()
        explanation_prefixes = (
            'what ', 'why ', 'how ', 'explain', 'describe', 'tell me',
            'recommend', 'suggest', 'what is', 'what are', 'pros and cons',
            'compare', 'is it better', 'which tech', 'which database'
        )
        if any(text.startswith(p) for p in explanation_prefixes) and not any(kw in text for kw in ['instead of', 'replace', 'remove', 'add task', 'add phase', 'delete phase', 'change to']):
            return True
        return False

    @classmethod
    def _is_ambiguous_request(cls, prompt_text: str):
        text = (prompt_text or "").strip().lower()
        ambiguous_exacts = [
            'change database', 'change the database', 'switch database',
            'change tech stack', 'change the tech stack', 'update tech stack',
            'change framework', 'change architecture', 'optimize', 'improve',
            'update deployment', 'change hosting', 'modify roadmap'
        ]
        if text in ambiguous_exacts:
            return True
        if (text.startswith('change ') or text.startswith('update ') or text.startswith('switch ')) and len(text.split()) <= 3:
            if not any(kw in text for kw in ['to', 'with', 'instead', 'phase', 'task', 'add', 'remove']):
                return True
        return False

    @classmethod
    def _extract_technology_migration(cls, prompt_text: str = "", current_tech_stack: str = "", new_tech_stack: str = "", change_summary: str = ""):
        search_texts = [t.strip() for t in [prompt_text, change_summary] if t and t.strip()]

        patterns = [
            (r'(?i)(?:use|switch to|migrate to|change to|adopt)\s+([A-Za-z0-9_.+/# -]+?)\s+(?:instead of|rather than|in place of)\s+([A-Za-z0-9_.+/# -]+)', False),
            (r'(?i)(?:replace|remove|swap|drop)\s+([A-Za-z0-9_.+/# -]+?)\s+(?:with|by|and use)\s+([A-Za-z0-9_.+/# -]+)', True),
            (r'(?i)(?:switch|migrate|move)\s+from\s+([A-Za-z0-9_.+/# -]+?)\s+to\s+([A-Za-z0-9_.+/# -]+)', True),
        ]

        old_tech = ""
        new_tech = ""

        for text in search_texts:
            for pat, is_old_first in patterns:
                m = re.search(pat, text)
                if m:
                    first = m.group(1).strip()
                    second = m.group(2).strip()
                    first = re.split(r'\s+(?:across|throughout|in|for|before|after|\.)\s*', first, flags=re.I)[0].strip()
                    second = re.split(r'\s+(?:across|throughout|in|for|before|after|\.)\s*', second, flags=re.I)[0].strip()
                    if is_old_first:
                        old_tech, new_tech = first, second
                    else:
                        new_tech, old_tech = first, second
                    break
            if old_tech and new_tech:
                break

        if (not old_tech or not new_tech) and current_tech_stack and new_tech_stack and current_tech_stack != new_tech_stack:
            curr_parts = [p.strip() for p in re.split(r'[,/|;]+', current_tech_stack) if p.strip()]
            new_parts = [p.strip() for p in re.split(r'[,/|;]+', new_tech_stack) if p.strip()]
            removed = [p for p in curr_parts if not any(p.lower() == np.lower() for np in new_parts)]
            added = [p for p in new_parts if not any(p.lower() == cp.lower() for cp in curr_parts)]
            if removed and added:
                old_tech = removed[0]
                new_tech = " & ".join(added)

        old_tech = re.sub(r'^(?:the|an|a)\s+', '', old_tech, flags=re.IGNORECASE).strip().rstrip('.,;')
        new_tech = re.sub(r'^(?:the|an|a)\s+', '', new_tech, flags=re.IGNORECASE).strip().rstrip('.,;')
        if old_tech and new_tech and old_tech.lower() != new_tech.lower():
            return old_tech, new_tech
        return "", ""

    @classmethod
    def _sanitize_phase_data_structure(cls, phase_dict):
        if not isinstance(phase_dict, dict):
            return phase_dict
        milestones = phase_dict.get('milestones', [])
        clean_milestones = []
        for m_idx, m in enumerate(milestones, start=1):
            if not isinstance(m, dict):
                continue
            seen_titles = set()
            clean_tasks = []
            for t_idx, t in enumerate(m.get('tasks', []), start=1):
                if not isinstance(t, dict):
                    continue
                norm_title = (t.get('title') or '').strip().lower()
                if not norm_title or norm_title in seen_titles:
                    continue
                seen_titles.add(norm_title)
                t_copy = dict(t)
                t_copy['order'] = len(clean_tasks) + 1
                clean_tasks.append(t_copy)
            if clean_tasks:
                m_copy = dict(m)
                m_copy['order'] = len(clean_milestones) + 1
                m_copy['tasks'] = clean_tasks
                clean_milestones.append(m_copy)
        phase_dict['milestones'] = clean_milestones
        return phase_dict

    @classmethod
    def _apply_generic_roadmap_intent(cls, roadmap, data, prompt_text="", current_tech_stack=""):
        if not isinstance(data, dict):
            return data

        if cls._is_explanation_request(prompt_text):
            data['action'] = 'none'
            data['operation'] = 'explanation'
            data['phase_data'] = None
            data['affected_phases'] = None
            data['target_phase_id'] = None
            data['target_phase_order'] = None
            return data

        if cls._is_ambiguous_request(prompt_text):
            data['action'] = 'none'
            data['operation'] = 'clarification'
            data['phase_data'] = None
            data['affected_phases'] = None
            data['target_phase_id'] = None
            data['target_phase_order'] = None
            if not data.get('explanation') or '?' not in data.get('explanation', '') or 'clarif' not in data.get('explanation', '').lower():
                data['explanation'] = "Could you please clarify your request by specifying the exact technology, phase, or tasks you would like to modify?"
            return data

        old_tech, new_tech = cls._extract_technology_migration(
            prompt_text=prompt_text,
            current_tech_stack=current_tech_stack,
            new_tech_stack=data.get('new_tech_stack', ''),
            change_summary=data.get('change_summary', '')
        )

        if old_tech and new_tech:
            old_tokens = [old_tech]
            cleaned_sub = re.sub(r'^(?:AWS|GCP|Azure)\s+', '', old_tech, flags=re.IGNORECASE).strip()
            if cleaned_sub and cleaned_sub.lower() != old_tech.lower() and len(cleaned_sub) >= 2:
                old_tokens.append(cleaned_sub)

            token_patterns = [re.compile(rf'\b{re.escape(tok)}\b', re.IGNORECASE) for tok in old_tokens]

            data['action'] = 'update_roadmap'
            data['operation'] = 'update_roadmap'
            if not data.get('changed_fields'):
                data['changed_fields'] = ['tech_stack', 'phases.tasks', 'phases.description']
            if not data.get('reason'):
                data['reason'] = f"Migrate architecture from {old_tech} to {new_tech}"

            affected = data.get('affected_phases')
            if not isinstance(affected, list):
                affected = []
                if data.get('phase_data'):
                    p_copy = dict(data['phase_data'])
                    if data.get('target_phase_order'):
                        p_copy['order'] = data['target_phase_order']
                    if data.get('target_phase_id'):
                        p_copy['id'] = data['target_phase_id']
                    affected.append(p_copy)
                data['affected_phases'] = affected

            def _clean_text(val):
                if not isinstance(val, str):
                    return val
                res = val
                for pat in token_patterns:
                    res = pat.sub(new_tech, res)
                return res

            for ap in affected:
                if isinstance(ap, dict):
                    ap['title'] = _clean_text(ap.get('title', ''))
                    ap['description'] = _clean_text(ap.get('description', ''))
                    for m in ap.get('milestones', []):
                        if isinstance(m, dict):
                            m['title'] = _clean_text(m.get('title', ''))
                            m['description'] = _clean_text(m.get('description', ''))
                            for t in m.get('tasks', []):
                                if isinstance(t, dict):
                                    t['title'] = _clean_text(t.get('title', ''))
                                    t['description'] = _clean_text(t.get('description', ''))

            affected_orders = {p.get('order') for p in affected if isinstance(p, dict) and p.get('order')}
            affected_ids = {p.get('id') for p in affected if isinstance(p, dict) and p.get('id')}

            for phase in roadmap.phases.all().order_by('order'):
                if phase.order in affected_orders or phase.id in affected_ids:
                    continue

                phase_full_text = f"{phase.title} {phase.description} " + " ".join([
                    f"{m.title} {m.description} " + " ".join([f"{t.title} {t.description}" for t in m.tasks.all()])
                    for m in phase.milestones.all()
                ])

                has_match = any(pat.search(phase_full_text) for pat in token_patterns)
                if has_match:
                    p_item = {
                        'id': phase.id,
                        'target_phase_id': phase.id,
                        'order': phase.order,
                        'title': _clean_text(phase.title),
                        'description': _clean_text(phase.description),
                        'duration': phase.duration,
                        'milestones': [],
                    }
                    for m in phase.milestones.all().order_by('order'):
                        m_item = {
                            'id': m.id,
                            'title': _clean_text(m.title),
                            'description': _clean_text(m.description),
                            'order': m.order,
                            'tasks': [],
                        }
                        for t in m.tasks.all().order_by('order'):
                            m_item['tasks'].append({
                                'id': t.id,
                                'title': _clean_text(t.title),
                                'description': _clean_text(t.description),
                                'order': t.order,
                            })
                        p_item['milestones'].append(m_item)
                    affected.append(p_item)

            affected.sort(key=lambda x: x.get('order', 1))
            data['affected_phases'] = [cls._sanitize_phase_data_structure(p) for p in affected]

            if not data.get('change_summary'):
                data['change_summary'] = f"Migrated from {old_tech} to {new_tech} across all affected roadmap phases."

            if not data.get('new_tech_stack') and current_tech_stack:
                data['new_tech_stack'] = _clean_text(current_tech_stack)

            return data

        removal_match = re.search(r'(?i)\b(?:remove|delete|drop|eliminate)\s+([A-Za-z0-9_.+/# -]+?)(?:\s+(?:from|in|across|throughout)\b|$|\.)', prompt_text)
        if removal_match and not re.search(r'(?i)\bphase\s*\d*\b', prompt_text):
            raw_target = removal_match.group(1).strip()
            raw_target = re.sub(r'^(?:the|all|a|an)\s+', '', raw_target, flags=re.I).strip()
            clean_tok = re.sub(r'\s+(?:payments?|auth|tasks?|features?|integrations?|services?|brokers?|databases?|systems?|gateways?)$', '', raw_target, flags=re.I).strip()
            search_terms = []
            if clean_tok and len(clean_tok) >= 3 and clean_tok.lower() not in ['phase', 'milestone', 'task', 'step', 'roadmap', 'the', 'all', 'user', 'app']:
                search_terms.append(clean_tok)
            if raw_target and raw_target not in search_terms and len(raw_target) >= 3 and raw_target.lower() not in ['phase', 'milestone', 'task', 'step', 'roadmap', 'the', 'all', 'user', 'app']:
                search_terms.append(raw_target)
            first_word = raw_target.split()[0]
            if len(first_word) >= 3 and first_word.lower() not in ['phase', 'milestone', 'task', 'step', 'roadmap', 'the', 'all', 'user', 'app'] and first_word not in search_terms:
                search_terms.append(first_word)

            if search_terms:
                rem_pat = re.compile(rf'\b(?:{"|".join(re.escape(t) for t in search_terms)})\b', re.IGNORECASE)
                affected = data.get('affected_phases') or []
                affected_ids = {p.get('id') for p in affected if isinstance(p, dict) and p.get('id')}
                affected_orders = {p.get('order') for p in affected if isinstance(p, dict) and p.get('order')}

                for phase in roadmap.phases.all().order_by('order'):
                    phase_text = f"{phase.title} {phase.description} " + " ".join([
                        f"{m.title} {m.description} " + " ".join([f"{t.title} {t.description}" for t in m.tasks.all()])
                        for m in phase.milestones.all()
                    ])
                    if rem_pat.search(phase_text):
                        if phase.id in affected_ids or phase.order in affected_orders:
                            continue
                        clean_ms = []
                        for m in phase.milestones.all().order_by('order'):
                            clean_ts = []
                            for t in m.tasks.all().order_by('order'):
                                if not rem_pat.search(f"{t.title} {t.description}"):
                                    clean_ts.append({
                                        'id': t.id,
                                        'title': t.title,
                                        'description': t.description,
                                        'order': len(clean_ts) + 1,
                                    })
                            if clean_ts:
                                clean_ms.append({
                                    'id': m.id,
                                    'title': rem_pat.sub('', m.title).strip() or m.title,
                                    'description': rem_pat.sub('', m.description).strip() or m.description,
                                    'order': len(clean_ms) + 1,
                                    'tasks': clean_ts,
                                })
                        affected.append({
                            'id': phase.id,
                            'target_phase_id': phase.id,
                            'order': phase.order,
                            'title': rem_pat.sub('', phase.title).strip() or phase.title,
                            'description': rem_pat.sub('', phase.description).strip() or phase.description,
                            'duration': phase.duration,
                            'milestones': clean_ms,
                        })

                if affected:
                    affected.sort(key=lambda x: x.get('order', 1))
                    data['action'] = 'update_roadmap'
                    data['operation'] = 'update_roadmap'
                    data['affected_phases'] = [cls._sanitize_phase_data_structure(p) for p in affected]
                    data['changed_fields'] = ['phases.tasks', 'phases.milestones']
                    data['reason'] = f"Remove {raw_target} and all dependent tasks across the complete roadmap"
                    data['change_summary'] = f"Removed {raw_target} and dependent setup, integration, and testing tasks from all affected phases."
                    data['explanation'] = f"I evaluated the complete roadmap for removing '{raw_target}'. I identified and removed dependent tasks across affected phases (from setup through testing/deployment) to keep the implementation flow logical without contradictory tasks."
                    return data

        is_explicit_add_phase = bool(re.search(r'(?i)\b(?:add|create|insert|new)\s+(?:a\s+)?phase\b', prompt_text))
        if data.get('action') == 'add_phase' and not is_explicit_add_phase:
            phase_to_merge = data.get('phase_data') or {}
            target_phase = None
            if data.get('target_phase_id'):
                target_phase = roadmap.phases.filter(id=data['target_phase_id']).first()
            if not target_phase and data.get('target_phase_order'):
                target_phase = roadmap.phases.filter(order=data['target_phase_order']).first()
            if not target_phase:
                target_phase = roadmap.phases.filter(order=2).first() or roadmap.phases.first()
            if target_phase and phase_to_merge:
                merged_milestones = []
                for m in target_phase.milestones.all().order_by('order'):
                    merged_milestones.append({
                        'id': m.id,
                        'title': m.title,
                        'description': m.description,
                        'order': m.order,
                        'tasks': [{'id': t.id, 'title': t.title, 'description': t.description, 'order': t.order} for t in m.tasks.all().order_by('order')]
                    })
                for new_m in phase_to_merge.get('milestones', []):
                    merged_milestones.append(new_m)
                data['action'] = 'edit_phase'
                data['operation'] = 'add_task'
                data['target_phase_id'] = target_phase.id
                data['target_phase_order'] = target_phase.order
                data['phase_data'] = {
                    'id': target_phase.id,
                    'order': target_phase.order,
                    'title': target_phase.title,
                    'description': target_phase.description,
                    'duration': target_phase.duration,
                    'milestones': merged_milestones,
                }

        if data.get('phase_data'):
            data['phase_data'] = cls._sanitize_phase_data_structure(data['phase_data'])

        if data.get('affected_phases'):
            data['affected_phases'] = [cls._sanitize_phase_data_structure(p) for p in data['affected_phases']]
            for p in data['affected_phases']:
                if isinstance(p, dict):
                    matched = None
                    if p.get('id'):
                        try:
                            matched = roadmap.phases.filter(id=int(p['id'])).first()
                        except (ValueError, TypeError):
                            pass
                    if not matched and p.get('order'):
                        try:
                            matched = roadmap.phases.filter(order=int(p['order'])).first()
                        except (ValueError, TypeError):
                            pass
                    if not matched and p.get('title'):
                        matched = roadmap.phases.filter(title__iexact=p['title'].strip()).first()
                    if matched:
                        p['id'] = matched.id
                        p['order'] = matched.order
                        p['target_phase_id'] = matched.id

            data['affected_phases'].sort(key=lambda x: x.get('order', 1))
            if len(data['affected_phases']) > 1:
                data['action'] = 'update_roadmap'
                data['operation'] = 'update_roadmap'

        return data

    @classmethod
    def chat(cls, project, roadmap, prompt_text: str, conversation_history: list = None, active_phase_id: int = None, completed_task_ids: list = None):
        completed_task_set = set(completed_task_ids or [])
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
                f"Complete Roadmap Analysis Mandate: Even though Phase {active_phase.order} ('{active_phase.title}') is focused, check EVERY add, edit, or delete request against the COMPLETE roadmap from setup through deployment. Identify where the change belongs and whether it affects other phases. Suggest any necessary additions, edits, removals, or reordering to keep the implementation flow logical. When multiple phases are affected, use action='update_roadmap' and include all affected phases in affected_phases.\n"
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
            f"Instructions:\n"
            f"1. Complete Roadmap Lifecycle Analysis:\n"
            f"   - Check EVERY add, edit, or delete request against the COMPLETE roadmap from start to finish (foundation, features, integrations, testing, deployment).\n"
            f"   - Identify where the change belongs and whether it affects other phases.\n"
            f"   - When a feature or technology is removed, find and update or remove all tasks that depend on it across ALL phases.\n"
            f"   - When a feature is edited, revise its affected tasks and any dependent later work.\n"
            f"   - Suggest necessary additions, edits, removals, or reordering to keep the implementation flow logical from setup through deployment.\n"
            f"   - Do NOT automatically add a new phase or leave outdated, duplicate, or contradictory tasks behind. Integrate changes into existing logical phases where possible.\n"
            f"2. Multi-Phase vs Single-Phase Actions:\n"
            f"   - If multiple phases are affected or cross-phase changes are needed: action='update_roadmap', operation='update_roadmap', with all affected phases in 'affected_phases'.\n"
            f"   - If strictly a single phase is affected: action='edit_phase', operation='add_task'/'edit_task'/'remove_task', target_phase_id=exact phase ID, target_phase_order=exact phase order, phase_data=updated phase.\n"
            f"   - For explicit new phase request only: action='add_phase', operation='add_phase'.\n"
            f"   - For deleting an entire phase: action='delete_phase', operation='delete_phase', target_phase_id=exact phase ID.\n"
            f"3. Explanation & Proposal Summary:\n"
            f"   - In 'explanation', show the user the proposed changes and briefly explain why they are needed to keep the architecture and workflow logical.\n"
            f"4. Explanation vs Ambiguity:\n"
            f"   - For advice or questions: action='none', operation='explanation'.\n"
            f"   - For ambiguous requests: action='none', operation='clarification', ask a focused question.\n"
            f"5. Completed Tasks Preservation:\n"
            f"   - Preserve completed task statuses (is_completed: true) for tasks that remain valid. If an affected task is completed and replaced, explain the impact in impact_on_completed_tasks.\n"
            f"6. Return strictly JSON conforming to RoadmapCopilotResponse schema."
        )

        user_content = prompt_text
        if conversation_history:
            history_lines = []
            for item in conversation_history[-6:]:
                role = item.get('role', 'user')
                content = item.get('content', '')
                history_lines.append(f"{role}: {content}")
            user_content = f"Recent Conversation History:\n" + "\n".join(history_lines) + f"\n\nCurrent User Request: {prompt_text}"

        if GroqService.is_available():
            try:
                raw_json = GroqService.generate_json(
                    system_instruction,
                    user_content
                )
                normalized = cls._normalize_copilot_data(raw_json)
                resolved = cls._resolve_target_phase(roadmap, normalized, active_phase=active_phase, prompt_text=prompt_text)
                propagated = cls._apply_generic_roadmap_intent(roadmap, resolved, prompt_text=prompt_text, current_tech_stack=project.tech_stack)
                validated = RoadmapCopilotResponse.model_validate(propagated)
                return validated.model_dump()
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
                validated = RoadmapCopilotResponse.model_validate(propagated)
                return validated.model_dump()
            except Exception:
                continue

        raise RuntimeError("Failed to generate response from AI Roadmap Copilot.")
