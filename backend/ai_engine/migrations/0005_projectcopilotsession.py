import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ai_engine', '0004_alter_projectdatabaseschema_project_and_more'),
        ('projects', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProjectCopilotSession',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('confirmed_decisions', models.JSONField(default=list)),
                ('messages', models.JSONField(default=list)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('project', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='copilot_session', to='projects.project')),
            ],
        ),
    ]
