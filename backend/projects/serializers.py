from rest_framework import serializers
from .models import Project


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            'id',
            'name',
            'description',
            'requirements',
            'tech_stack',
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_name(self, value):
        trimmed = value.strip()
        if not trimmed:
            raise serializers.ValidationError('Project name cannot be blank.')
        return trimmed

    def validate_description(self, value):
        trimmed = value.strip()
        if not trimmed:
            raise serializers.ValidationError('Project description cannot be blank.')
        return trimmed

    def validate_status(self, value):
        valid_statuses = [choice[0] for choice in Project.STATUS_CHOICES]
        if value not in valid_statuses:
            raise serializers.ValidationError(
                f"Invalid status '{value}'. Allowed: {', '.join(valid_statuses)}"
            )
        return value
