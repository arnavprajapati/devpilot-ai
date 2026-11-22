from rest_framework import serializers
from .models import Roadmap, RoadmapMilestone, RoadmapPhase, RoadmapTask, RoadmapWhiteboard, ProjectDatabaseSchema


class RoadmapTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoadmapTask
        fields = ['id', 'title', 'description', 'order']


class RoadmapMilestoneSerializer(serializers.ModelSerializer):
    tasks = RoadmapTaskSerializer(many=True, read_only=True)

    class Meta:
        model = RoadmapMilestone
        fields = ['id', 'title', 'description', 'order', 'tasks']


class RoadmapPhaseSerializer(serializers.ModelSerializer):
    milestones = RoadmapMilestoneSerializer(many=True, read_only=True)

    class Meta:
        model = RoadmapPhase
        fields = ['id', 'title', 'description', 'duration', 'order', 'milestones']


class RoadmapSerializer(serializers.ModelSerializer):
    phases = RoadmapPhaseSerializer(many=True, read_only=True)
    has_customized_whiteboard = serializers.SerializerMethodField()

    class Meta:
        model = Roadmap
        fields = [
            'id',
            'project',
            'title',
            'summary',
            'phases',
            'has_customized_whiteboard',
            'created_at',
            'updated_at',
        ]

    def get_has_customized_whiteboard(self, obj):
        if hasattr(obj, 'whiteboard') and obj.whiteboard:
            return obj.whiteboard.is_customized
        return False


class RoadmapWhiteboardSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoadmapWhiteboard
        fields = [
            'id',
            'roadmap',
            'nodes',
            'edges',
            'viewport',
            'is_customized',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'roadmap', 'created_at', 'updated_at']


class ProjectDatabaseSchemaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectDatabaseSchema
        fields = [
            'id',
            'project',
            'schema_type',
            'db_engine',
            'tables',
            'nodes',
            'edges',
            'viewport',
            'code',
            'sql_ddl',
            'nosql_code',
            'is_customized',
            'pending_proposal',
            'has_conflict',
            'conflict_data',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'project', 'created_at', 'updated_at']
