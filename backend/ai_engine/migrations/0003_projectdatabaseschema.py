import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ai_engine', '0002_roadmapwhiteboard'),
        ('projects', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProjectDatabaseSchema',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('schema_type', models.CharField(default='table', max_length=20)),
                ('db_engine', models.CharField(default='PostgreSQL', max_length=50)),
                ('tables', models.JSONField(default=list)),
                ('nodes', models.JSONField(default=list)),
                ('edges', models.JSONField(default=list)),
                ('viewport', models.JSONField(blank=True, default=dict)),
                ('sql_ddl', models.TextField(blank=True, default='')),
                ('nosql_code', models.TextField(blank=True, default='')),
                ('is_customized', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('project', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='database_schema', to='projects.project')),
            ],
        ),
    ]
