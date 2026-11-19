import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ai_engine', '0003_projectdatabaseschema'),
        ('projects', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='projectdatabaseschema',
            name='project',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='database_schemas', to='projects.project'),
        ),
        migrations.AlterUniqueTogether(
            name='projectdatabaseschema',
            unique_together={('project', 'schema_type')},
        ),
    ]
