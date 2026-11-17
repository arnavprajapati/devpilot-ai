import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('projects', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Roadmap',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255)),
                ('summary', models.TextField(blank=True, default='')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('project', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='roadmap', to='projects.project')),
            ],
        ),
        migrations.CreateModel(
            name='RoadmapPhase',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True, default='')),
                ('duration', models.CharField(blank=True, default='', max_length=100)),
                ('order', models.PositiveIntegerField(default=1)),
                ('roadmap', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='phases', to='ai_engine.roadmap')),
            ],
            options={
                'ordering': ['order'],
            },
        ),
        migrations.CreateModel(
            name='RoadmapMilestone',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True, default='')),
                ('order', models.PositiveIntegerField(default=1)),
                ('phase', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='milestones', to='ai_engine.roadmapphase')),
            ],
            options={
                'ordering': ['order'],
            },
        ),
        migrations.CreateModel(
            name='RoadmapTask',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True, default='')),
                ('order', models.PositiveIntegerField(default=1)),
                ('milestone', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tasks', to='ai_engine.roadmapmilestone')),
            ],
            options={
                'ordering': ['order'],
            },
        ),
    ]
