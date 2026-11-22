import django.db.models.deletion
from django.db import migrations, models


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
        migrations.AlterField(
            model_name='projectdatabaseschema',
            name='project',
            field=models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='database_schema', to='projects.project'),
        ),
    ]
