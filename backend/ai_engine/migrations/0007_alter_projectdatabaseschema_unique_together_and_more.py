import django.db.models.deletion
from django.db import migrations, models


def consolidate_duplicate_schemas(apps, schema_editor):
    Project = apps.get_model('projects', 'Project')
    ProjectDatabaseSchema = apps.get_model('ai_engine', 'ProjectDatabaseSchema')

    from collections import defaultdict
    schemas_by_project = defaultdict(list)
    for schema in ProjectDatabaseSchema.objects.all().order_by('id'):
        schemas_by_project[schema.project_id].append(schema)

    for project_id, schemas in schemas_by_project.items():
        if len(schemas) <= 1:
            continue

        try:
            project = Project.objects.get(id=project_id)
            stack = (project.tech_stack or '').lower()
            reqs = (project.requirements or '').lower()
            combined = f"{stack} {reqs}"
        except Exception:
            combined = ''

        has_mongo = any(k in combined for k in ['mongo', 'nosql', 'document', 'couch', 'dynamo', 'firestore'])
        has_sql = any(k in combined for k in ['sql', 'postgres', 'mysql', 'sqlite', 'relational', 'supabase', 'mariadb', 'oracle'])

        chosen = None
        if has_mongo and not has_sql:
            for s in schemas:
                if s.schema_type == 'document':
                    chosen = s
                    break
        elif has_sql and not has_mongo:
            for s in schemas:
                if s.schema_type == 'table':
                    chosen = s
                    break

        if not chosen:
            chosen = max(schemas, key=lambda s: len(s.tables or []))

        secondary_schemas = [s for s in schemas if s.id != chosen.id]

        all_secondary_data = []
        for sec in secondary_schemas:
            all_secondary_data.append({
                'id': sec.id,
                'schema_type': sec.schema_type,
                'db_engine': sec.db_engine,
                'tables': sec.tables or [],
                'sql_ddl': sec.sql_ddl or '',
                'nosql_code': sec.nosql_code or '',
            })

        chosen_table_names = {t.get('name', '').lower() for t in (chosen.tables or [])}
        for sec in secondary_schemas:
            for t in (sec.tables or []):
                t_name = t.get('name', '').lower()
                if t_name and t_name not in chosen_table_names:
                    chosen.tables.append(t)
                    chosen_table_names.add(t_name)

        if has_mongo and has_sql:
            chosen.has_conflict = True
            chosen.conflict_data = {
                'detected_engines': ['PostgreSQL', 'MongoDB'],
                'message': 'Multiple schemas detected during migration. All entities preserved.',
                'archived_schemas': all_secondary_data,
            }
        elif all_secondary_data:
            chosen.conflict_data = {
                'archived_schemas': all_secondary_data,
            }

        if not chosen.code:
            chosen.code = chosen.sql_ddl if chosen.schema_type == 'table' else chosen.nosql_code

        chosen.save()

        for sec in secondary_schemas:
            sec.delete()


class Migration(migrations.Migration):

    dependencies = [
        ('ai_engine', '0006_projectcopilotsession_schema_messages_and_more'),
        ('projects', '0001_initial'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='projectdatabaseschema',
            unique_together=set(),
        ),
        migrations.AddField(
            model_name='projectdatabaseschema',
            name='code',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='projectdatabaseschema',
            name='conflict_data',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name='projectdatabaseschema',
            name='has_conflict',
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(
            consolidate_duplicate_schemas,
            reverse_code=migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name='projectdatabaseschema',
            name='project',
            field=models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='database_schema', to='projects.project'),
        ),
    ]
