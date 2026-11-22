from django.db import models


class Roadmap(models.Model):
    project = models.OneToOneField('projects.Project', on_delete=models.CASCADE, related_name='roadmap')
    title = models.CharField(max_length=255)
    summary = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} (Project: {self.project.name})"


class RoadmapPhase(models.Model):
    roadmap = models.ForeignKey(Roadmap, on_delete=models.CASCADE, related_name='phases')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    duration = models.CharField(max_length=100, blank=True, default='')
    order = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Phase {self.order}: {self.title}"


class RoadmapMilestone(models.Model):
    phase = models.ForeignKey(RoadmapPhase, on_delete=models.CASCADE, related_name='milestones')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    order = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Milestone {self.order}: {self.title}"


class RoadmapTask(models.Model):
    milestone = models.ForeignKey(RoadmapMilestone, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    order = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Task {self.order}: {self.title}"


class RoadmapWhiteboard(models.Model):
    roadmap = models.OneToOneField(Roadmap, on_delete=models.CASCADE, related_name='whiteboard')
    nodes = models.JSONField(default=list)
    edges = models.JSONField(default=list)
    viewport = models.JSONField(default=dict, blank=True)
    is_customized = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Whiteboard for {self.roadmap.title}"


class ProjectDatabaseSchema(models.Model):
    project = models.OneToOneField('projects.Project', on_delete=models.CASCADE, related_name='database_schema')
    schema_type = models.CharField(max_length=20, default='table')
    db_engine = models.CharField(max_length=50, default='PostgreSQL')
    tables = models.JSONField(default=list)
    nodes = models.JSONField(default=list)
    edges = models.JSONField(default=list)
    viewport = models.JSONField(default=dict, blank=True)
    code = models.TextField(blank=True, default='')
    sql_ddl = models.TextField(blank=True, default='')
    nosql_code = models.TextField(blank=True, default='')
    is_customized = models.BooleanField(default=False)
    pending_proposal = models.JSONField(default=dict, blank=True)
    has_conflict = models.BooleanField(default=False)
    conflict_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Database Schema for {self.project.name} ({self.db_engine})"


class ProjectCopilotSession(models.Model):
    project = models.OneToOneField('projects.Project', on_delete=models.CASCADE, related_name='copilot_session')
    confirmed_decisions = models.JSONField(default=list)
    messages = models.JSONField(default=list)
    schema_messages = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Copilot Session for {self.project.name}"
