from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ai_engine', '0005_projectcopilotsession'),
    ]

    operations = [
        migrations.AddField(
            model_name='projectcopilotsession',
            name='schema_messages',
            field=models.JSONField(default=list),
        ),
        migrations.AddField(
            model_name='projectdatabaseschema',
            name='pending_proposal',
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
