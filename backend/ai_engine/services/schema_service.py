import json
import os
from django.db import transaction
from ..models import ProjectCopilotSession, ProjectDatabaseSchema
from .schemas import (
    RoadmapSchemaProposalSchema,
    SingleDatabaseSchemaProposal,
    GeneratedEntityPromptResponse,
)
from .schema_synthesis import SchemaSynthesisHelper

class DatabaseSchemaService(SchemaSynthesisHelper):
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
            from ..models import ProjectDatabaseSchema
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
        from ..models import ProjectDatabaseSchema
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
    def generate_entity_from_prompt(cls, prompt_text, schema_type='table', db_engine='PostgreSQL', current_entity=None, project=None):
        from ..models import ProjectCopilotSession
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
            from ..models import ProjectDatabaseSchema
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
        from ..models import ProjectCopilotSession, ProjectDatabaseSchema
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
        from ..models import ProjectDatabaseSchema
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
        from ..models import ProjectDatabaseSchema
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
            from ..models import ProjectDatabaseSchema
            schema = ProjectDatabaseSchema.objects.filter(project=project).first()
        return schema

