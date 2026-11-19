import os
import json
import requests
from django.conf import settings
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List, Optional


class GeneratedTaskSchema(BaseModel):
    title: str = Field(description="Actionable task title")
    description: str = Field(default="", description="One-sentence implementation note")
    order: int = Field(default=1)


class GeneratedMilestoneSchema(BaseModel):
    title: str = Field(description="Milestone deliverable title")
    description: str = Field(default="", description="One-sentence deliverable objective")
    order: int = Field(default=1)
    tasks: List[GeneratedTaskSchema] = Field(default_factory=list, description="Actionable tasks")


class GeneratedPhaseSchema(BaseModel):
    title: str = Field(description="Phase title")
    description: str = Field(default="", description="One-sentence phase goal")
    duration: str = Field(default="2 Weeks", description="Duration e.g. Weeks 1-3")
    order: int = Field(default=1)
    milestones: List[GeneratedMilestoneSchema] = Field(default_factory=list, description="Milestones per phase")


class GeneratedRoadmapSchema(BaseModel):
    title: str = Field(description="Roadmap title")
    summary: str = Field(description="Executive summary of the technical plan")
    phases: List[GeneratedPhaseSchema] = Field(description="Dynamic list of development phases based on project scope")


class RoadmapCopilotResponse(BaseModel):
    explanation: str = Field(default="", description="Helpful, conversational explanation of architecture, use cases, and changes.")
    action: str = Field(default="none", description="Action type: none, add_phase, edit_phase, delete_phase")
    phase_data: Optional[GeneratedPhaseSchema] = Field(default=None, description="New or edited phase details when action is add_phase or edit_phase")
    target_phase_id: Optional[int] = Field(default=None, description="Database ID of target phase being edited or deleted")
    target_phase_order: Optional[int] = Field(default=None, description="Phase order/number of target phase being edited or deleted")


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
            getattr(settings, 'GEMINI_API_KEY', '') or
            os.environ.get('GROQ_API_KEY', '') or
            os.environ.get('GEMINI_API_KEY', '') or
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
                    content = data["choices"][0]["message"]["content"]
                    cleaned = content.strip()
                    for prefix in ("```json", "```"):
                        if cleaned.startswith(prefix):
                            cleaned = cleaned[len(prefix):]
                    if cleaned.endswith("```"):
                        cleaned = cleaned[:-3]
                    return json.loads(cleaned.strip())
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
            f"You are a Principal Software Architect. Generate a production-grade engineering roadmap tailored specifically to the project scope and complexity.\n\n"
            f"Project: {project.name}\n"
            f"Description: {project.description}\n"
            f"Tech Stack: {project.tech_stack or 'Modern Full-Stack'}\n"
            f"Requirements: {project.requirements or 'Standard production architecture'}\n\n"
            f"Rules:\n"
            f"- Dynamically determine the realistic number of development phases (typically 3 to 5 phases) based on '{project.name}' actual scope and complexity. Do not force a fixed number.\n"
            f"- Each phase should have 2 to 3 key milestones.\n"
            f"- Under each milestone, provide 2 to 4 actionable tasks tailored to the tech stack.\n"
            f"- Keep task descriptions concise (under 15 words) and direct.\n"
            f"- No generic placeholders. Tailor all items specifically to '{project.name}'."
        )

    @classmethod
    def _parse_response(cls, raw_text):
        raw_text = raw_text.strip()
        try:
            validated = GeneratedRoadmapSchema.model_validate_json(raw_text)
            return validated.model_dump()
        except Exception:
            cleaned = raw_text
            for prefix in ('```json', '```'):
                if cleaned.startswith(prefix):
                    cleaned = cleaned[len(prefix):]
            if cleaned.endswith('```'):
                cleaned = cleaned[:-3]
            parsed = json.loads(cleaned.strip())
            validated = GeneratedRoadmapSchema.model_validate(parsed)
            return validated.model_dump()

    @classmethod
    def generate_roadmap(cls, project):
        if GroqService.is_available():
            try:
                system_instruction = (
                    "You are a Principal Software Architect. Generate a production-grade engineering roadmap tailored specifically to the project scope and complexity. "
                    "Output valid JSON matching this schema: title (str), summary (str), and phases (list of phases each with phase_number (int), title (str), description (str), duration (str), milestones (list of milestones each with title (str), description (str), order (int), tasks (list of tasks each with title (str), description (str), order (int))))."
                )
                prompt = cls._build_prompt(project)
                raw_json = GroqService.generate_json(system_instruction, prompt)
                validated = GeneratedRoadmapSchema.model_validate(raw_json)
                return validated.model_dump()
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
                        max_output_tokens=3072,
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
                data = validated.model_dump()
                data['schema_type'] = schema_type
                data['db_engine'] = db_engine
                return data
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
                data['schema_type'] = schema_type
                data['db_engine'] = db_engine
                return data
            except Exception as exc:
                last_error = exc
                continue

        raise RuntimeError(f"Database schema generation unavailable. Last error: {last_error}")

    @classmethod
    def build_layout(cls, schema_type, tables, db_engine):
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
                    if target_table_name != source_table_name and any(t.get('name') == target_table_name for t in tables):
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
        if 'action' not in data:
            data['action'] = 'none'

        phase = data.get('phase_data')
        if isinstance(phase, dict):
            if not phase.get('description'):
                phase_title = phase.get('title', 'Development Phase')
                phase['description'] = f"Comprehensive architecture and implementation for {phase_title}."
            milestones = phase.get('milestones', [])
            for m_idx, m in enumerate(milestones, start=1):
                if isinstance(m, dict):
                    m_title = m.get('title') or f"Milestone {m_idx}"
                    if not m.get('description'):
                        m['description'] = f"Deliver and validate core components for {m_title}."
                    raw_tasks = m.get('tasks', [])
                    norm_tasks = []
                    for t_idx, t in enumerate(raw_tasks, start=1):
                        if isinstance(t, str):
                            t_title = t.strip()
                            t_desc = f"Implement and configure {t_title}."
                            norm_tasks.append({'title': t_title, 'description': t_desc, 'order': t_idx})
                        elif isinstance(t, dict):
                            t_title = t.get('title') or t.get('name') or f'Task {t_idx}'
                            t_desc = (t.get('description') or '').strip()
                            if not t_desc:
                                t_desc = f"Implement and verify {t_title}."
                            norm_tasks.append({
                                'title': t_title,
                                'description': t_desc,
                                'order': t.get('order', t_idx)
                            })
                    m['tasks'] = norm_tasks
                    if 'order' not in m:
                        m['order'] = m_idx
        return data

    @classmethod
    def chat(cls, project, roadmap, prompt_text: str, conversation_history: list = None, active_phase_id: int = None):
        phases_summary = []
        for phase in roadmap.phases.all().order_by('order'):
            m_list = []
            for m in phase.milestones.all().order_by('order'):
                t_list = []
                for t in m.tasks.all().order_by('order'):
                    t_list.append({
                        "title": t.title,
                        "description": t.description,
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

        system_instruction = (
            f"You are the Principal Software Architect and Technical Lead Copilot for DevPilot.\n"
            f"Project: '{project.name}'\n"
            f"Description: {project.description}\n"
            f"Tech Stack: {project.tech_stack or 'Modern Full-Stack'}\n"
            f"Requirements: {project.requirements or 'Standard production architecture'}\n\n"
            f"Current Roadmap Summary:\n"
            f"Roadmap Title: {roadmap.title}\n"
            f"Summary: {roadmap.summary}\n"
            f"Active Phases ({len(phases_summary)} total):\n"
            f"{json.dumps(phases_summary, indent=2)}\n\n"
            f"Rules and capabilities:\n"
            f"1. Conversational explanation: In the 'explanation' field, provide an insightful, direct, and well-structured explanation in professional English. Structure your response using clear markdown headings (e.g. '### Overview', '### Key Objectives'), clean bullet points, and modern markdown tables when comparing tools or options. Wrap only key technical terms in double asterisks naturally; in tables, keep cell text clean and readable without excessive asterisks on every single word. Avoid solid walls of unformatted text.\n"
            f"2. Add Phase: If the user wants to add, insert, or create a new phase (e.g. payments, websockets, notifications, testing, ci/cd, deployment, auth), set action='add_phase'. Populate 'phase_data' with realistic duration, 2-3 key milestones, and 2-3 actionable tasks per milestone tailored to the tech stack.\n"
            f"   - LOGICAL PLACEMENT & PRESERVATION: Testing, polish, and deployment phases MUST ALWAYS remain at the end of the roadmap. When adding a feature phase, specify 'order' in 'phase_data' so it is logically placed before testing/deployment, and subsequent phases automatically shift forward. Existing phases and architecture must be preserved, never wiped.\n"
            f"   - MANDATORY DESCRIPTIONS: Every phase MUST have a comprehensive 'description'. Every milestone MUST have a title and a clear 1-sentence 'description'. Every task in 'tasks' MUST have BOTH a concise 'title' AND a specific 1-sentence 'description' explaining the implementation detail (like in existing roadmap phases). Never leave 'description' empty.\n"
            f"3. Edit Phase: If the user asks to modify an existing phase, set action='edit_phase'. Set 'target_phase_order' or 'target_phase_id' to that phase, and provide the updated 'phase_data' with all milestone and task descriptions filled.\n"
            f"4. Delete Phase: If the user asks to remove or delete a phase, set action='delete_phase' and set 'target_phase_order' or 'target_phase_id'.\n"
            f"5. Questions / Chat: If the user is just asking questions or discussing architecture without changing phases, set action='none' and phase_data=None.\n"
            f"Return strictly JSON conforming to RoadmapCopilotResponse schema."
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
                validated = RoadmapCopilotResponse.model_validate(normalized)
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
                validated = RoadmapCopilotResponse.model_validate(normalized)
                return validated.model_dump()
            except Exception:
                continue

        raise RuntimeError("Failed to generate response from AI Roadmap Copilot.")
