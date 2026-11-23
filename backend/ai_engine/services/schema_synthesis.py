import json
import re
import os
from django.conf import settings
from google import genai
from google.genai import types
from .schemas import (
    SingleDatabaseSchemaProposal,
    GeneratedEntityPromptResponse,
    GeneratedDBSchema,
)
from .ai_client import GroqService

class SchemaSynthesisHelper:
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

