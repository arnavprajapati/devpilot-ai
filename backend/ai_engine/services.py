import os
import re
import json
import requests
from django.conf import settings
from django.db import transaction
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
    roadmap_version: Optional[str] = Field(default=None, description="ISO timestamp of roadmap version")


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


class RoadmapSchemaChangeEntity(BaseModel):
    name: str = Field(description="Name of the table or collection")
    action: Literal["create", "modify", "delete", "preserve"] = Field(description="Action to take on this entity")
    description: Optional[str] = Field(default="", description="Technical reason and description of changes")
    columns_added: List[str] = Field(default_factory=list, description="Names of columns or fields added")
    columns_removed: List[str] = Field(default_factory=list, description="Names of columns or fields removed")


class RoadmapSchemaProposalSchema(BaseModel):
    has_changes: bool = Field(description="True if roadmap changes affect stored data models; False if no data-model impact")
    summary: str = Field(default="", description="Summary of schema proposal")
    before_after_summary: str = Field(default="", description="Before vs After comparison e.g. Before: 4 tables (...). After: 6 tables (added: subscriptions, invoices; modified: users).")
    modeling_notes: str = Field(default="", description="Explanation of SQL vs NoSQL architectural design choices for this stack")
    affected_entities: List[RoadmapSchemaChangeEntity] = Field(default_factory=list, description="List of affected entities with actions")
    proposed_tables: List[GeneratedTableSchema] = Field(default_factory=list, description="Full proposed list of tables/collections, merging new/modified ones while preserving all existing unmodified tables and IDs")
    sql_ddl: Optional[str] = Field(default="", description="Updated SQL DDL if relational")
    nosql_code: Optional[str] = Field(default="", description="Updated NoSQL code if document")


class SingleDatabaseSchemaProposal(BaseModel):
    summary: str = Field(description="Summary of database schema changes derived from project context")
    rationale: str = Field(description="Architectural rationale explaining entity models and relationships")
    db_engine: str = Field(description="Target database engine, e.g. PostgreSQL, MongoDB, MySQL, SQLite, Supabase")
    schema_type: str = Field(description="'table' for relational or 'document' for document databases")
    tables: List[GeneratedTableSchema] = Field(description="List of database tables or document collections")
    added_entities: List[str] = Field(default_factory=list, description="Names of new entities added compared to existing schema")
    modified_entities: List[str] = Field(default_factory=list, description="Names of entities modified compared to existing schema")
    preserved_entities: List[str] = Field(default_factory=list, description="Names of entities preserved intact from existing schema")
    removed_entities: List[str] = Field(default_factory=list, description="Names of entities removed from existing schema")
    code: str = Field(default="", description="Ready-to-execute schema code: SQL DDL for relational or Mongoose/TypeScript schema for document NoSQL")
    modeling_notes: str = Field(default="", description="Key modeling decisions specific to this engine")


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
    def determine_database_technology(cls, project):
        stack = (project.tech_stack or '').lower()
        reqs = (project.requirements or '').lower()
        combined = f"{stack} {reqs}"

        saved = getattr(project, 'database_schema', None)
        if saved and saved.db_engine and not saved.has_conflict:
            s_type = saved.schema_type or ('document' if 'mongo' in saved.db_engine.lower() else 'table')
            return saved.db_engine, s_type, False, {}

        has_mongo = any(k in combined for k in ['mongo', 'nosql', 'document', 'couch', 'dynamo', 'firestore'])
        has_sql = any(k in combined for k in ['sql', 'postgres', 'mysql', 'sqlite', 'relational', 'supabase', 'mariadb', 'oracle'])

        has_conflict = False
        conflict_data = {}

        if has_mongo and has_sql:
            has_conflict = True
            conflict_data = {
                'detected_engines': ['PostgreSQL', 'MongoDB'],
                'message': "Conflicting database technologies detected in project specifications. Relational schema selected by default; document model preserved.",
            }
            return 'PostgreSQL', 'table', has_conflict, conflict_data

        if has_mongo:
            engine = 'MongoDB'
            for token in re.findall(r'[A-Za-z0-9_]+', project.tech_stack or ''):
                tl = token.lower()
                if tl in ('mongodb', 'mongo', 'dynamodb', 'couchdb', 'firestore'):
                    engine = token
                    break
            return engine, 'document', False, {}

        if 'mysql' in stack:
            return 'MySQL', 'table', False, {}
        if 'sqlite' in stack:
            return 'SQLite', 'table', False, {}
        if 'supabase' in stack:
            return 'Supabase', 'table', False, {}
        if 'mariadb' in stack:
            return 'MariaDB', 'table', False, {}

        return 'PostgreSQL', 'table', False, {}

    @classmethod
    def detect_schema_type(cls, project):
        engine, schema_type, _, _ = cls.determine_database_technology(project)
        return schema_type, engine

    @classmethod
    def _generate_default_sql_columns(cls, ent_name):
        clean = (ent_name or '').strip().lower()
        singular = clean[:-1] if clean.endswith('s') and len(clean) > 3 else clean
        if clean in ('users', 'accounts', 'user', 'account'):
            return [
                {'name': 'id', 'data_type': 'UUID', 'is_primary': True},
                {'name': 'email', 'data_type': 'VARCHAR(255)', 'is_unique': True},
                {'name': 'name', 'data_type': 'VARCHAR(255)'},
                {'name': 'status', 'data_type': 'VARCHAR(50)'},
                {'name': 'created_at', 'data_type': 'TIMESTAMP'},
            ]
        name_col = f"{singular}_name" if singular not in ('item', 'record', 'data', 'detail') else 'name'
        return [
            {'name': 'id', 'data_type': 'UUID', 'is_primary': True},
            {'name': 'user_id', 'data_type': 'UUID', 'is_foreign': True, 'references': 'users.id'},
            {'name': name_col, 'data_type': 'VARCHAR(255)'},
            {'name': 'description', 'data_type': 'TEXT'},
            {'name': 'status', 'data_type': 'VARCHAR(50)'},
            {'name': 'created_at', 'data_type': 'TIMESTAMP'},
            {'name': 'updated_at', 'data_type': 'TIMESTAMP'},
        ]

    @classmethod
    def _generate_default_nosql_columns(cls, ent_name):
        clean = (ent_name or '').strip().lower()
        singular = clean[:-1] if clean.endswith('s') and len(clean) > 3 else clean
        if clean in ('users', 'accounts', 'user', 'account'):
            return [
                {'name': '_id', 'data_type': 'ObjectId', 'is_primary': True},
                {'name': 'email', 'data_type': 'String', 'is_unique': True},
                {'name': 'name', 'data_type': 'String'},
                {'name': 'settings', 'data_type': 'Object'},
                {'name': 'created_at', 'data_type': 'Date'},
            ]
        name_col = f"{singular}_name" if singular not in ('item', 'record', 'data', 'detail') else 'name'
        return [
            {'name': '_id', 'data_type': 'ObjectId', 'is_primary': True},
            {'name': 'user_id', 'data_type': 'ObjectId', 'is_foreign': True, 'references': 'users._id'},
            {'name': name_col, 'data_type': 'String'},
            {'name': 'metadata', 'data_type': 'Object'},
            {'name': 'status', 'data_type': 'String'},
            {'name': 'created_at', 'data_type': 'Date'},
        ]

    @classmethod
    def _convert_sql_columns_to_nosql(cls, sql_cols):
        nosql_cols = []
        for c in sql_cols:
            c_name = c.get('name', '')
            if c.get('is_primary'):
                nosql_cols.append({'name': '_id', 'data_type': 'ObjectId', 'is_primary': True})
            elif c.get('is_foreign') and c.get('references'):
                target = c.get('references').split('.')[0]
                nosql_cols.append({
                    'name': c_name,
                    'data_type': 'ObjectId',
                    'is_foreign': True,
                    'references': f"{target}._id",
                })
            else:
                dt = (c.get('data_type') or 'VARCHAR(255)').upper()
                nosql_type = 'String'
                if 'INT' in dt or 'DECIMAL' in dt or 'FLOAT' in dt:
                    nosql_type = 'Number'
                elif 'BOOL' in dt:
                    nosql_type = 'Boolean'
                elif 'TIME' in dt or 'DATE' in dt:
                    nosql_type = 'Date'
                elif 'JSON' in dt:
                    nosql_type = 'Object'
                nosql_cols.append({'name': c_name, 'data_type': nosql_type, 'is_unique': c.get('is_unique')})
        if not any(c.get('is_primary') for c in nosql_cols):
            nosql_cols.insert(0, {'name': '_id', 'data_type': 'ObjectId', 'is_primary': True})
        return nosql_cols

    @classmethod
    def _convert_nosql_columns_to_sql(cls, nosql_cols):
        sql_cols = []
        for c in nosql_cols:
            c_name = c.get('name', '')
            if c.get('is_primary') or c_name == '_id':
                sql_cols.append({'name': 'id', 'data_type': 'UUID', 'is_primary': True})
            elif c.get('is_foreign') and c.get('references'):
                target = c.get('references').split('.')[0]
                sql_cols.append({
                    'name': c_name,
                    'data_type': 'UUID',
                    'is_foreign': True,
                    'references': f"{target}.id",
                })
            else:
                dt = (c.get('data_type') or 'String').capitalize()
                sql_type = 'VARCHAR(255)'
                if dt == 'Number':
                    sql_type = 'INTEGER'
                elif dt == 'Boolean':
                    sql_type = 'BOOLEAN'
                elif dt == 'Date':
                    sql_type = 'TIMESTAMP'
                elif dt in ('Object', 'Array'):
                    sql_type = 'JSON'
                sql_cols.append({'name': c_name, 'data_type': sql_type, 'is_unique': c.get('is_unique')})
        if not any(c.get('is_primary') for c in sql_cols):
            sql_cols.insert(0, {'name': 'id', 'data_type': 'UUID', 'is_primary': True})
        return sql_cols

    @classmethod
    def _build_sql_ddl(cls, tables):
        statements = []
        for t in tables:
            cols = []
            for c in t.get('columns', []):
                pk = " PRIMARY KEY" if c.get('is_primary') else ""
                fk = f" REFERENCES {c.get('references')}" if c.get('is_foreign') and c.get('references') else ""
                uniq = " UNIQUE" if c.get('is_unique') else ""
                cols.append(f"  {c.get('name')} {c.get('data_type', 'VARCHAR(255)')}{pk}{fk}{uniq}")
            statements.append(f"CREATE TABLE {t.get('name')} (\n" + ",\n".join(cols) + "\n);")
        return "\n\n".join(statements)

    @classmethod
    def _build_nosql_code(cls, tables):
        snippets = []
        for t in tables:
            fields = []
            for c in t.get('columns', []):
                ref_opt = f", ref: '{c.get('references', '').split('.')[0]}'" if c.get('is_foreign') and c.get('references') else ""
                fields.append(f"  {c.get('name')}: {{ type: {c.get('data_type', 'String')}{ref_opt} }}")
            snippets.append(f"const {t.get('name').capitalize()}Schema = new Schema({{\n" + ",\n".join(fields) + "\n}});")
        return "\n\n".join(snippets)

    @classmethod
    def _extract_domain_entities_dynamically(cls, project, existing_tables=None, schema_type='table'):
        existing_tables = existing_tables or []
        entity_dict = {}
        for t in existing_tables:
            raw_name = (t.get('name') or '').strip()
            name_key = raw_name.lower()
            if raw_name and name_key not in entity_dict:
                entity_dict[name_key] = {
                    'name': raw_name,
                    'description': t.get('description') or f"{raw_name.replace('_', ' ').capitalize()} records",
                    'columns': t.get('columns') or [],
                }

        if not entity_dict:
            roadmap = getattr(project, 'roadmap', None)
            text_corpus = f"{project.name} {project.description or ''} {project.requirements or ''}"
            if roadmap:
                for p in roadmap.phases.all():
                    text_corpus += f" {p.title} {p.description or ''}"
                    for m in p.milestones.all():
                        text_corpus += f" {m.title}"
                        for tk in m.tasks.all():
                            text_corpus += f" {tk.title} {tk.description or ''}"

            words = re.findall(r'[A-Za-z][A-Za-z0-9_]{2,}', text_corpus)
            stopwords = {
                'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'been',
                'will', 'should', 'would', 'could', 'create', 'setup', 'build', 'implement',
                'design', 'manage', 'configure', 'update', 'delete', 'system', 'application',
                'service', 'platform', 'feature', 'support', 'using', 'based', 'backend',
                'frontend', 'database', 'project', 'architecture', 'complete', 'roadmap',
                'phase', 'milestone', 'task', 'tasks', 'user', 'users', 'status', 'type',
                'item', 'items', 'data', 'details', 'component', 'components', 'module',
                'modules', 'step', 'steps', 'flow', 'page', 'view', 'api', 'apis', 'test',
                'testing', 'deploy', 'deployment', 'docker', 'react', 'node', 'django',
                'python', 'typescript', 'javascript', 'html', 'css', 'tailwind', 'postgres',
                'postgresql', 'mongodb', 'redis', 'render', 'vercel', 'aws', 'cloud', 'first',
                'second', 'third', 'initial', 'simple', 'clean', 'stack', 'tool', 'tools',
            }

            discovered_nouns = []
            for w in words:
                wl = w.lower()
                if wl not in stopwords and len(wl) >= 3 and not wl.isdigit():
                    noun = wl if wl.endswith('s') and len(wl) > 3 and wl[:-1] not in stopwords else (wl + 's' if not wl.endswith('s') else wl)
                    if noun not in discovered_nouns and noun not in entity_dict:
                        discovered_nouns.append(noun)

            if 'users' not in discovered_nouns and 'users' not in entity_dict:
                discovered_nouns.insert(0, 'users')

            if len(discovered_nouns) == 1 and 'users' in discovered_nouns:
                clean_proj = re.sub(r'[^a-zA-Z0-9]+', '_', project.name.lower()).strip('_')
                base_name = f"{clean_proj}_records" if clean_proj else "workspace_records"
                discovered_nouns.append(base_name)

            for noun in discovered_nouns[:6]:
                if noun not in entity_dict:
                    cols = cls._generate_default_nosql_columns(noun) if schema_type == 'document' else cls._generate_default_sql_columns(noun)
                    entity_dict[noun] = {
                        'name': noun,
                        'description': f"{noun.replace('_', ' ').capitalize()} records and data attributes",
                        'columns': cols,
                    }

        return list(entity_dict.values())

    @classmethod
    def _synthesize_single_proposal_from_context(cls, project, db_engine='PostgreSQL', schema_type='table', existing_tables=None):
        existing_tables = existing_tables or []
        entities = cls._extract_domain_entities_dynamically(project, existing_tables, schema_type)

        existing_names = set((t.get('name') or '').strip().lower() for t in existing_tables if t.get('name'))
        tables = []
        for ent in entities:
            existing_match = next((t for t in existing_tables if (t.get('name') or '').strip().lower() == ent['name'].lower()), None)
            if existing_match:
                tables.append(existing_match)
            else:
                tables.append({
                    'name': ent['name'],
                    'description': ent['description'],
                    'columns': ent['columns'],
                })

        code = cls._build_sql_ddl(tables) if schema_type == 'table' else cls._build_nosql_code(tables)
        prop_names = set(t['name'].lower() for t in tables)

        return {
            'summary': f"Unified schema for {project.name} targeting {db_engine} ({schema_type}).",
            'rationale': f"Normalized schema in {db_engine} preserving existing entities and aligned with roadmap requirements.",
            'db_engine': db_engine,
            'schema_type': schema_type,
            'tables': tables,
            'code': code,
            'added_entities': list(prop_names - existing_names),
            'modified_entities': [],
            'preserved_entities': list(existing_names & prop_names),
            'removed_entities': [],
            'modeling_notes': f"{db_engine} architecture tailored to {project.name}.",
        }

    @classmethod
    def _invoke_single_proposal_llm(cls, system_instruction, prompt):
        proposal_res = None
        if GroqService.is_available():
            try:
                raw_json = GroqService.generate_json(system_instruction, prompt, timeout=35)
                validated = SingleDatabaseSchemaProposal.model_validate(raw_json)
                proposal_res = validated.model_dump()
            except Exception:
                pass

        if not proposal_res:
            api_key = getattr(settings, 'GEMINI_API_KEY', '') or ''
            if api_key:
                configured_model = getattr(settings, 'GEMINI_MODEL', 'gemini-3-flash-preview')
                models_to_try = [configured_model] + [m for m in cls.FALLBACK_MODELS if m != configured_model]

                try:
                    client = genai.Client(api_key=api_key, http_options={'api_version': 'v1beta'})
                    for model_name in models_to_try:
                        try:
                            response = client.models.generate_content(
                                model=model_name,
                                contents=f"{system_instruction}\n\n{prompt}",
                                config=types.GenerateContentConfig(
                                    response_mime_type='application/json',
                                    response_schema=SingleDatabaseSchemaProposal,
                                    temperature=0.2,
                                ),
                            )
                            raw = (response.text or '').strip()
                            validated = SingleDatabaseSchemaProposal.model_validate_json(raw)
                            proposal_res = validated.model_dump()
                            break
                        except Exception:
                            continue
                except Exception:
                    pass

        return proposal_res

    @classmethod
    def generate_regeneration_proposal(cls, project):
        project.refresh_from_db()
        roadmap = getattr(project, 'roadmap', None)
        roadmap_version = str(roadmap.updated_at.isoformat()) if roadmap and roadmap.updated_at else ''

        phases_lines = []
        if roadmap:
            for p in roadmap.phases.all().order_by('order'):
                tasks = [t.title for m in p.milestones.all() for t in m.tasks.all()]
                phases_lines.append(f"Phase {p.order}: {p.title} - Tasks: {', '.join(tasks)}")
        roadmap_summary = '\n'.join(phases_lines) if phases_lines else 'No roadmap phases defined yet.'

        session = getattr(project, 'copilot_session', None)
        confirmed_decisions = session.confirmed_decisions if session else []
        decisions_summary = '\n'.join([f'- {d}' for d in confirmed_decisions]) if confirmed_decisions else 'None'

        db_engine, schema_type, has_conflict, conflict_data = cls.determine_database_technology(project)

        saved_schema = getattr(project, 'database_schema', None)
        if not saved_schema:
            from .models import ProjectDatabaseSchema
            saved_schema = ProjectDatabaseSchema.objects.filter(project=project).first()

        existing_tables = saved_schema.tables if saved_schema and saved_schema.tables else []
        existing_names = set((t.get('name') or '').strip().lower() for t in existing_tables if t.get('name'))
        known_entities = ', '.join(existing_names) or 'None yet'
        schema_version = str(saved_schema.updated_at.isoformat()) if saved_schema and saved_schema.updated_at else ''

        system_instruction = (
            f"You are a Principal Database Architect & System Designer.\n"
            f"Your responsibility is to design a unified production-ready database schema strictly for this software project.\n\n"
            f"Project Name: {project.name}\n"
            f"Description: {project.description}\n"
            f"Tech Stack: {project.tech_stack or 'React, Node.js, PostgreSQL'}\n"
            f"Target Database Technology: {db_engine} ({schema_type.upper()})\n"
            f"Requirements: {project.requirements or 'Standard production system'}\n"
            f"Confirmed Architectural Decisions:\n{decisions_summary}\n\n"
            f"Accepted Execution Roadmap:\n{roadmap_summary}\n\n"
            f"Current Saved Schema ({db_engine}):\n{json.dumps(existing_tables)}\n\n"
            f"Strict Architectural & Scope Isolation Rules:\n"
            f"1. Strict Domain Scope Isolation: You must ONLY generate entities and fields that directly belong to '{project.name}' and its stated requirements. Strictly do NOT introduce unrelated domain entities.\n"
            f"2. Preservation of Existing Project Work: Preserve all relevant existing user-defined entities ({known_entities}).\n"
            f"3. Paradigm Accuracy for {db_engine} ({schema_type}):\n"
            f"   - If relational ({db_engine}): normalized 3NF tables, typed columns, primary keys (is_primary: true), foreign keys (is_foreign: true, references: '<target>.id'). Runnable CREATE TABLE DDL in code.\n"
            f"   - If document ({db_engine}): flexible collections, typed fields, embedding or referencing (references: '<Target>._id'). Runnable Mongoose schema in code.\n"
            f"4. Output strictly valid JSON conforming to SingleDatabaseSchemaProposal schema."
        )

        user_prompt = (
            f"Generate a database schema proposal derived strictly from '{project.name}' requirements and existing schemas.\n"
            f"Preserve all existing schema entities ({known_entities}) targeting {db_engine}."
        )

        proposal = cls._invoke_single_proposal_llm(system_instruction, user_prompt)
        if proposal:
            proj_text = f"{project.name} {project.description or ''} {project.requirements or ''}".lower()
            is_chat_project = any(k in proj_text for k in ['chat', 'messaging', 'channel', 'conversation'])
            tables = proposal.get('tables', [])
            has_unrelated_chat = any(
                t.get('name', '').lower() in ['channels', 'channel_messages', 'messages', 'conversations']
                for t in tables
            )
            if has_unrelated_chat and not is_chat_project:
                proposal = None

        if not proposal:
            proposal = cls._synthesize_single_proposal_from_context(
                project=project,
                db_engine=db_engine,
                schema_type=schema_type,
                existing_tables=existing_tables,
            )

        proposal['db_engine'] = db_engine
        proposal['schema_type'] = schema_type
        proposal['roadmap_version'] = roadmap_version
        proposal['schema_version'] = schema_version
        proposal['has_conflict'] = has_conflict
        proposal['conflict_data'] = conflict_data

        prop_names = set((t.get('name') or '').strip().lower() for t in proposal.get('tables', []) if t.get('name'))
        proposal['preserved_entities'] = list(existing_names & prop_names)
        proposal['added_entities'] = list(prop_names - existing_names)
        proposal['removed_entities'] = list(existing_names - prop_names)

        return proposal

    @classmethod
    def apply_regeneration(cls, project, proposal_data, client_roadmap_version=None, client_schema_version=None):
        from .models import ProjectDatabaseSchema
        project.refresh_from_db()

        if hasattr(project, 'roadmap') and project.roadmap and project.roadmap.updated_at:
            current_roadmap_version = str(project.roadmap.updated_at.isoformat())
            if client_roadmap_version and current_roadmap_version and client_roadmap_version != current_roadmap_version:
                raise ValueError("STALE_REGENERATION: The roadmap was modified after this proposal was generated. Please regenerate with the latest roadmap.")

        saved_schema = getattr(project, 'database_schema', None)
        if not saved_schema:
            saved_schema = ProjectDatabaseSchema.objects.filter(project=project).first()

        curr_schema_ver = str(saved_schema.updated_at.isoformat()) if saved_schema and saved_schema.updated_at else ''
        if client_schema_version and curr_schema_ver and client_schema_version != curr_schema_ver:
            raise ValueError("STALE_REGENERATION: The database schema was modified after this proposal was generated. Please regenerate again.")

        db_engine = proposal_data.get('db_engine') or (saved_schema.db_engine if saved_schema else 'PostgreSQL')
        schema_type = proposal_data.get('schema_type') or (saved_schema.schema_type if saved_schema else 'table')
        tables = proposal_data.get('tables', [])

        nodes, edges = cls.build_layout(schema_type, tables, db_engine)
        if saved_schema and saved_schema.nodes:
            pos_map = {n['id']: n.get('position') for n in saved_schema.nodes if isinstance(n, dict) and 'id' in n and 'position' in n}
            for n in nodes:
                if n['id'] in pos_map and pos_map[n['id']]:
                    n['position'] = pos_map[n['id']]

        code = proposal_data.get('code') or ''
        sql_ddl = code if schema_type == 'table' else proposal_data.get('sql_ddl', '')
        nosql_code = code if schema_type == 'document' else proposal_data.get('nosql_code', '')

        with transaction.atomic():
            saved_schema, _ = ProjectDatabaseSchema.objects.update_or_create(
                project=project,
                defaults={
                    'schema_type': schema_type,
                    'db_engine': db_engine,
                    'tables': tables,
                    'nodes': nodes,
                    'edges': edges,
                    'code': code,
                    'sql_ddl': sql_ddl,
                    'nosql_code': nosql_code,
                    'is_customized': True,
                    'pending_proposal': {},
                    'has_conflict': proposal_data.get('has_conflict', False),
                    'conflict_data': proposal_data.get('conflict_data', {}),
                }
            )

        return saved_schema

    @classmethod
    def generate_initial_schema(cls, project):
        proposal = cls.generate_regeneration_proposal(project)
        return cls.apply_regeneration(project, proposal)
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
    def _invoke_entity_llm(cls, system_instruction, prompt_text):
        res = None
        if GroqService.is_available():
            try:
                raw_json = GroqService.generate_json(
                    system_instruction,
                    f"Design entity based on prompt: {prompt_text}"
                )
                validated = GeneratedEntityPromptResponse.model_validate(raw_json)
                res = validated.model_dump()
            except Exception:
                pass

        if not res:
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
                    res = validated.model_dump()
                    break
                except Exception:
                    continue

        if not res:
            raise RuntimeError("Failed to generate entity from prompt.")
        return res

    @classmethod
    def _invoke_proposal_llm(cls, system_instruction):
        proposal_res = None
        if GroqService.is_available():
            try:
                raw_json = GroqService.generate_json(
                    system_instruction,
                    "Generate schema change proposal based on roadmap updates."
                )
                validated = RoadmapSchemaProposalSchema.model_validate(raw_json)
                proposal_res = validated.model_dump()
            except Exception:
                pass

        if not proposal_res:
            api_key = getattr(settings, 'GEMINI_API_KEY', '') or ''
            if api_key:
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
                                response_schema=RoadmapSchemaProposalSchema,
                                temperature=0.2,
                            ),
                        )
                        raw = (response.text or '').strip()
                        validated = RoadmapSchemaProposalSchema.model_validate_json(raw)
                        proposal_res = validated.model_dump()
                        break
                    except Exception:
                        continue
        return proposal_res

    @classmethod
    def generate_entity_from_prompt(cls, prompt_text, schema_type='table', db_engine='PostgreSQL', current_entity=None, project=None):
        from .models import ProjectCopilotSession
        context = ""
        if current_entity:
            context += f"Current entity: name='{current_entity.get('name')}', description='{current_entity.get('description')}', columns={json.dumps(current_entity.get('columns', []))}\n"
        if project:
            context += f"Project: {project.name}, Tech Stack: {project.tech_stack or ''}\n"
            if project.description:
                context += f"Description: {project.description}\n"
            if project.requirements:
                context += f"Requirements: {project.requirements}\n"

        roadmap_context = ""
        if project and hasattr(project, 'roadmap') and project.roadmap:
            rm = project.roadmap
            phases_summary = []
            for p in rm.phases.all().order_by('order'):
                tasks = [t.title for m in p.milestones.all() for t in m.tasks.all()]
                phases_summary.append(f"- Phase {p.order} ({p.title}): {tasks}")
            if phases_summary:
                roadmap_context = "Accepted Project Roadmap & Features:\n" + "\n".join(phases_summary) + "\n"

        existing_schema_context = ""
        if project:
            from .models import ProjectDatabaseSchema
            saved_schema = getattr(project, 'database_schema', None)
            if not saved_schema:
                saved_schema = ProjectDatabaseSchema.objects.filter(project=project).first()
            if saved_schema and saved_schema.tables:
                table_names = [t.get('name') for t in saved_schema.tables if t.get('name')]
                existing_schema_context = f"Existing {saved_schema.schema_type} entities in saved schema: {table_names}\n"

        session = None
        confirmed_decisions_context = ""
        schema_chat_history = ""
        if project:
            session, _ = ProjectCopilotSession.objects.get_or_create(project=project)
            if session.confirmed_decisions:
                confirmed_decisions_context = "Confirmed Architecture Decisions:\n" + "\n".join([f"- {d}" for d in session.confirmed_decisions]) + "\n"
            if session.schema_messages:
                hist_lines = []
                for m in session.schema_messages[-8:]:
                    role = m.get('role', 'user')
                    content = m.get('content', '')
                    if content:
                        hist_lines.append(f"{role}: {content}")
                if hist_lines:
                    schema_chat_history = "Recent Schema Chat Context:\n" + "\n".join(hist_lines) + "\n"

        system_instruction = (
            f"You are DevPilot AI, a Principal Database Architect & Engineering Copilot.\n"
            f"You are having a conversation with the technical team about this database {schema_type} ('table' or 'document') for {db_engine}.\n"
            f"{context}\n"
            f"{roadmap_context}\n"
            f"{existing_schema_context}\n"
            f"{confirmed_decisions_context}\n"
            f"{schema_chat_history}\n"
            f"User Message: {prompt_text}\n\n"
            f"Mandatory Guidelines:\n"
            f"- Output valid JSON matching GeneratedEntityPromptResponse schema.\n"
            f"- explanation: Speak conversationally like a knowledgeable, helpful architect. Answer technical questions, explain design choices, or detail what was modified or added.\n"
            f"- Read-only policy: Questions, advice, recommendations, and explanations must NOT mutate or overwrite saved data. Only generate entity changes when explicitly asked to add, edit, or model data.\n"
            f"- primary_entity: The entity currently being edited ({current_entity.get('name') if current_entity else 'entity'}). Keep existing columns/fields unless the user asked to change them.\n"
            f"- new_related_entities: If the user asked to create or connect a new table/collection, define full new entities. Otherwise keep this list empty [].\n"
            f"- relationships: Define foreign key connections (source_table, target_table, relationship_type, foreign_key_column).\n"
            f"- SQL vs NoSQL Modeling Accuracy:\n"
            f"  * SQL ({db_engine}): normalized tables, typed columns (UUID, VARCHAR, INTEGER, TIMESTAMP, BOOLEAN), primary keys, foreign keys (references: '<target_table>.id'), constraints.\n"
            f"  * NoSQL ({db_engine}): document collections, embedded data where appropriate or references (references: '<TargetCollection>._id'), NoSQL types (ObjectId, String, Number, Boolean, Date, Array<String>, Object).\n"
            f"  * Explain meaningful modeling differences between relational tables and document collections when relevant."
        )

        res = cls._invoke_entity_llm(system_instruction, prompt_text)

        if session:
            session.schema_messages.append({'role': 'user', 'content': prompt_text})
            session.schema_messages.append({'role': 'assistant', 'content': res.get('explanation', '')})
            if len(session.schema_messages) > 30:
                session.schema_messages = session.schema_messages[-30:]
            session.save()

        return res

    @classmethod
    def sync_proposal_with_roadmap(cls, project, roadmap):
        from .models import ProjectCopilotSession, ProjectDatabaseSchema
        project.refresh_from_db()
        schema = getattr(project, 'database_schema', None)
        if not schema:
            schema = ProjectDatabaseSchema.objects.filter(project=project).first()
        if not schema:
            return

        phases_summary = []
        for p in roadmap.phases.all().order_by('order'):
            tasks = [t.title for m in p.milestones.all() for t in m.tasks.all()]
            phases_summary.append(f"Phase {p.order} ({p.title}): {tasks}")

        roadmap_text = f"Roadmap Title: {roadmap.title}\nPhases & Tasks:\n" + "\n".join(phases_summary)
        roadmap_version = str(roadmap.updated_at.isoformat()) if roadmap.updated_at else ""

        session = getattr(project, 'copilot_session', None)
        confirmed_decisions = session.confirmed_decisions if session else []
        decisions_text = "\n".join([f"- {d}" for d in confirmed_decisions]) if confirmed_decisions else "None"

        schema_type = schema.schema_type
        db_engine = schema.db_engine
        existing_tables = schema.tables or []
        existing_names = [t.get('name') for t in existing_tables if t.get('name')]

        system_instruction = (
            f"You are a Principal Database Architect.\n"
            f"Project: {project.name}\n"
            f"Description: {project.description}\n"
            f"Tech Stack: {project.tech_stack or ''}\n"
            f"Requirements: {project.requirements or ''}\n"
            f"Confirmed Project Invariants:\n{decisions_text}\n\n"
            f"Current Database {schema_type.upper()} Schema ({db_engine}):\n"
            f"Existing entities: {existing_names}\n"
            f"Full existing entities data: {json.dumps(existing_tables)}\n\n"
            f"Updated Project Roadmap:\n"
            f"{roadmap_text}\n\n"
            f"Task:\n"
            f"Analyze if the updated roadmap changes genuinely introduce new data entities, models, or storage requirements that affect the database schema.\n"
            f"Strict Architectural Rules:\n"
            f"1. No Data-Model Impact Check:\n"
            f"   - If the roadmap changes do NOT affect stored data (e.g. pure frontend styling, UI tweaks, CI/CD build pipeline, deployment on Render/cloud, testing/QA suites, reordering tasks without new data entities):\n"
            f"     Set has_changes: false, leave proposed_tables empty [], and explain in summary that no schema changes are needed.\n"
            f"     DO NOT invent unneeded tables or artificial schema migrations.\n"
            f"2. Genuine Data-Model Impact:\n"
            f"   - If the roadmap genuinely adds or modifies stored business data (e.g. adding authentication, file sharing/permissions, subscriptions/billing, comments, storage quota enforcement):\n"
            f"     Set has_changes: true.\n"
            f"     Preserve ALL existing unrelated entities, their IDs, columns, and relationships!\n"
            f"     In proposed_tables, include the FULL list of tables/collections: keep existing unmodified tables completely intact with their original names and columns, and add/modify only the genuinely affected entities.\n"
            f"     Provide a clear before_after_summary.\n"
            f"     List affected entities in affected_entities with actions ('create', 'modify', 'delete', 'preserve').\n"
            f"3. Accurate Modeling for {schema_type.upper()} ({db_engine}):\n"
            f"   - Match target database engine rules accurately.\n"
            f"4. Output strictly valid JSON conforming to RoadmapSchemaProposalSchema."
        )

        proposal_res = cls._invoke_proposal_llm(system_instruction)
        if not proposal_res:
            return

        if proposal_res.get('has_changes'):
            prop_tables = proposal_res.get('proposed_tables', [])
            if prop_tables:
                try:
                    nodes, edges = cls.build_layout(schema.schema_type, prop_tables, schema.db_engine)
                except Exception:
                    nodes, edges = [], []
                existing_node_positions = {n['id']: n.get('position') for n in (schema.nodes or []) if isinstance(n, dict) and 'id' in n and 'position' in n}
                for node in nodes:
                    if node['id'] in existing_node_positions and existing_node_positions[node['id']]:
                        node['position'] = existing_node_positions[node['id']]
                schema.pending_proposal = {
                    'roadmap_version': roadmap_version,
                    'has_changes': True,
                    'summary': proposal_res.get('summary', 'Roadmap data model synchronization proposal.'),
                    'before_after_summary': proposal_res.get('before_after_summary', ''),
                    'modeling_notes': proposal_res.get('modeling_notes', ''),
                    'affected_entities': proposal_res.get('affected_entities', []),
                    'proposed_tables': prop_tables,
                    'proposed_nodes': nodes,
                    'proposed_edges': edges,
                    'sql_ddl': proposal_res.get('sql_ddl') or schema.sql_ddl,
                    'nosql_code': proposal_res.get('nosql_code') or schema.nosql_code,
                    'code': proposal_res.get('sql_ddl') or proposal_res.get('nosql_code') or schema.code,
                }
            else:
                schema.pending_proposal = {
                    'roadmap_version': roadmap_version,
                    'has_changes': False,
                    'summary': proposal_res.get('summary', 'No schema changes required for this roadmap update.'),
                    'before_after_summary': '',
                    'affected_entities': [],
                }
        else:
            schema.pending_proposal = {
                'roadmap_version': roadmap_version,
                'has_changes': False,
                'summary': proposal_res.get('summary', 'No schema changes required for this roadmap update.'),
                'before_after_summary': '',
                'affected_entities': [],
            }
        schema.save()
        return schema.pending_proposal

    @classmethod
    def apply_proposal(cls, project, client_roadmap_version=None):
        from .models import ProjectDatabaseSchema
        schema = getattr(project, 'database_schema', None)
        if not schema:
            schema = ProjectDatabaseSchema.objects.filter(project=project).first()
        if not schema:
            raise ValueError("No database schema found for this project.")
        proposal = schema.pending_proposal or {}
        if not proposal.get('has_changes'):
            return schema

        current_roadmap_version = str(project.roadmap.updated_at.isoformat()) if hasattr(project, 'roadmap') and project.roadmap and project.roadmap.updated_at else None
        prop_roadmap_version = proposal.get('roadmap_version')

        if current_roadmap_version and prop_roadmap_version and current_roadmap_version != prop_roadmap_version:
            raise ValueError("STALE_PROPOSAL: The project roadmap was updated after this schema proposal was generated. Please refresh the proposal against the latest roadmap.")

        if client_roadmap_version and current_roadmap_version and client_roadmap_version != current_roadmap_version:
            raise ValueError("STALE_PROPOSAL: The project roadmap was updated after this schema proposal was generated. Please refresh the proposal against the latest roadmap.")

        schema.tables = proposal.get('proposed_tables', schema.tables)
        schema.nodes = proposal.get('proposed_nodes', schema.nodes)
        schema.edges = proposal.get('proposed_edges', schema.edges)
        if proposal.get('code'):
            schema.code = proposal['code']
        if proposal.get('sql_ddl'):
            schema.sql_ddl = proposal['sql_ddl']
        if proposal.get('nosql_code'):
            schema.nosql_code = proposal['nosql_code']
        schema.is_customized = True
        schema.pending_proposal = {}
        schema.save()
        return schema

    @classmethod
    def dismiss_proposal(cls, project):
        from .models import ProjectDatabaseSchema
        schema = getattr(project, 'database_schema', None)
        if not schema:
            schema = ProjectDatabaseSchema.objects.filter(project=project).first()
        if schema:
            schema.pending_proposal = {}
            schema.save()
            return schema
        return None

    @classmethod
    def refresh_proposal(cls, project):
        if hasattr(project, 'roadmap') and project.roadmap:
            cls.sync_proposal_with_roadmap(project, project.roadmap)
        schema = getattr(project, 'database_schema', None)
        if not schema:
            from .models import ProjectDatabaseSchema
            schema = ProjectDatabaseSchema.objects.filter(project=project).first()
        return schema


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
                    auto_pat = re.compile(r'\b(?:auto(?:matic(?:ally)?)?[- ]+(?:upgrade|purchase|billing|charge)|automatically[- ]+charge)\b', re.I)
                    for t_idx, t in enumerate(raw_tasks, start=1):
                        if isinstance(t, str):
                            t_title = t.strip()
                            if auto_pat.search(t_title):
                                t_title = auto_pat.sub('prompt upgrade and plan selection', t_title)
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
                            if auto_pat.search(t_title):
                                t_title = auto_pat.sub('prompt upgrade and plan selection', t_title)
                            if auto_pat.search(t_desc):
                                t_desc = auto_pat.sub('prompt user with upgrade modal and plan selection options', t_desc)
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
                        'tasks': [{'id': t.id, 'title': t.title, 'description': t.description, 'order': t.order, 'is_completed': t.is_completed} for t in m.tasks.all().order_by('order')]
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
            p_data = cls._sanitize_phase_data_structure(data['phase_data'])
            target_p = None
            if data.get('target_phase_id'):
                target_p = roadmap.phases.filter(id=data['target_phase_id']).first()
            if not target_p and data.get('target_phase_order'):
                target_p = roadmap.phases.filter(order=data['target_phase_order']).first()
            if not target_p and p_data.get('title'):
                target_p = roadmap.phases.filter(title__iexact=p_data['title'].strip()).first()
            if target_p:
                p_data['id'] = target_p.id
                p_data['order'] = target_p.order
                p_data['target_phase_id'] = target_p.id
                data['target_phase_id'] = target_p.id
                data['target_phase_order'] = target_p.order
                db_task_ids = {t.id for m in target_p.milestones.all() for t in m.tasks.all()}
                for m in p_data.get('milestones', []):
                    if isinstance(m, dict):
                        for t in m.get('tasks', []):
                            if isinstance(t, dict) and t.get('id') in db_task_ids:
                                pass
            data['phase_data'] = p_data

        affected = data.get('affected_phases')
        if isinstance(affected, list) and affected:
            clean_affected = []
            for p in affected:
                if not isinstance(p, dict):
                    continue
                matched = None
                p_id = p.get('id') or p.get('target_phase_id')
                if p_id:
                    try:
                        matched = roadmap.phases.filter(id=int(p_id)).first()
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
                    db_task_ids = {t.id for m in matched.milestones.all() for t in m.tasks.all()}
                    for m in p.get('milestones', []):
                        if isinstance(m, dict):
                            for t in m.get('tasks', []):
                                if isinstance(t, dict) and t.get('id') in db_task_ids:
                                    pass
                    clean_affected.append(cls._sanitize_phase_data_structure(p))

            clean_affected.sort(key=lambda x: x.get('order', 1))
            data['affected_phases'] = clean_affected

            if len(clean_affected) > 1:
                data['action'] = 'update_roadmap'
                data['operation'] = 'update_roadmap'
            elif len(clean_affected) == 1:
                data['action'] = 'edit_phase'
                if not data.get('operation') or data['operation'] in ['explanation', 'clarification']:
                    data['operation'] = 'edit_task'
                data['target_phase_id'] = clean_affected[0].get('id')
                data['target_phase_order'] = clean_affected[0].get('order')
                data['phase_data'] = clean_affected[0]

        return data

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
            f"{decisions_context}\n"
            f"Mandatory Architectural Change Workflow for ALL Requests:\n"
            f"1. Context & Dependency Tracing Across Complete Roadmap:\n"
            f"   - Use the project's current saved details and complete roadmap as context.\n"
            f"   - For any request to add, edit, remove, or replace a feature, technology, or requirement, trace its dependencies across the complete roadmap:\n"
            f"     * Prerequisite work: Setup, SDKs, drivers, and schema foundations in early phases (e.g. Phase 1).\n"
            f"     * Core implementation: Domain models, APIs, and business workflows in feature phases (e.g. Phase 2/3).\n"
            f"     * Later work: Unit/integration testing, security audits, and deployment pipeline updates in later phases (e.g. Phase 4/5).\n"
            f"   - When a technology or feature is replaced or removed, remove or update obsolete tasks across all phases that depend on it.\n"
            f"2. Minimal Structured Change Proposal:\n"
            f"   - Generate a structured proposal affecting ONLY genuinely affected phases. Preserve existing architecture and all unrelated phases, tasks, IDs, order, and valid completion statuses.\n"
            f"   - Do NOT regenerate the whole architecture unless explicitly requested.\n"
            f"   - For multi-phase changes: action='update_roadmap', operation='update_roadmap', with all affected phases in 'affected_phases'.\n"
            f"   - For single-phase changes: action='edit_phase', operation='add_task'/'edit_task'/'remove_task', target_phase_id=exact phase ID, target_phase_order=exact phase order, phase_data=updated phase.\n"
            f"   - When a technology migration is requested, set 'new_tech_stack' to the updated full tech stack string.\n"
            f"3. Explanations & Confirmations:\n"
            f"   - In 'explanation', list each affected phase, explain WHY each needs a change, and present the proposal for user confirmation before applying.\n"
            f"   - Keep explanations and recommendations strictly read-only: action='none', operation='explanation'. Do not modify roadmap for advice or questions.\n"
            f"   - If the request or architectural impact is ambiguous or unclear: action='none', operation='clarification', and ask a focused question. Do not invent unrequested integrations.\n"
            f"4. Completed Tasks Preservation:\n"
            f"   - Strictly preserve completed task statuses (is_completed: true) for tasks that remain valid.\n"
            f"5. Architecture Source of Truth & Storage Limit Rule:\n"
            f"   - The current project tech stack and requirements are the authoritative source of truth.\n"
            f"   - For storage quotas or limits (such as a 5 GB limit), design tasks to present an upgrade prompt with selectable plan tiers. Never imply automatic charging or automatic plan upgrades.\n"
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
