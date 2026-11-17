import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ai_engine', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='RoadmapWhiteboard',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nodes', models.JSONField(default=list)),
                ('edges', models.JSONField(default=list)),
                ('viewport', models.JSONField(blank=True, default=dict)),
                ('is_customized', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('roadmap', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='whiteboard', to='ai_engine.roadmap')),
            ],
        ),
    ]
