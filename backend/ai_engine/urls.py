from django.urls import path
from .views import (
    ProjectRoadmapDetailView,
    ProjectRoadmapGenerateView,
    ProjectRoadmapChatCopilotView,
    ProjectRoadmapApplyPhaseActionView,
    ProjectRoadmapWhiteboardDetailView,
    ProjectRoadmapWhiteboardResetView,
    ProjectDatabaseSchemaDetailView,
    ProjectDatabaseSchemaGenerateView,
    ProjectDatabaseSchemaConfirmRegenerationView,
    ProjectDatabaseSchemaResetView,
    ProjectDatabaseSchemaGenerateEntityView,
    ProjectDatabaseSchemaProposalApplyView,
    ProjectDatabaseSchemaProposalDismissView,
    ProjectDatabaseSchemaProposalRefreshView,
)

urlpatterns = [
    path('projects/<int:project_id>/roadmap/', ProjectRoadmapDetailView.as_view(), name='project-roadmap'),
    path('projects/<int:project_id>/roadmap/generate/', ProjectRoadmapGenerateView.as_view(), name='project-roadmap-generate'),
    path('projects/<int:project_id>/roadmap/chat/', ProjectRoadmapChatCopilotView.as_view(), name='project-roadmap-chat'),
    path('projects/<int:project_id>/roadmap/apply-action/', ProjectRoadmapApplyPhaseActionView.as_view(), name='project-roadmap-apply-action'),
    path('projects/<int:project_id>/whiteboard/', ProjectRoadmapWhiteboardDetailView.as_view(), name='project-whiteboard'),
    path('projects/<int:project_id>/whiteboard/reset/', ProjectRoadmapWhiteboardResetView.as_view(), name='project-whiteboard-reset'),
    path('projects/<int:project_id>/database-schema/', ProjectDatabaseSchemaDetailView.as_view(), name='project-database-schema'),
    path('projects/<int:project_id>/database-schema/generate/', ProjectDatabaseSchemaGenerateView.as_view(), name='project-database-schema-generate'),
    path('projects/<int:project_id>/database-schema/confirm-regeneration/', ProjectDatabaseSchemaConfirmRegenerationView.as_view(), name='project-database-schema-confirm-regeneration'),
    path('projects/<int:project_id>/database-schema/reset/', ProjectDatabaseSchemaResetView.as_view(), name='project-database-schema-reset'),
    path('projects/<int:project_id>/database-schema/generate-entity/', ProjectDatabaseSchemaGenerateEntityView.as_view(), name='project-database-schema-generate-entity'),
    path('projects/<int:project_id>/database-schema/apply-proposal/', ProjectDatabaseSchemaProposalApplyView.as_view(), name='project-database-schema-apply-proposal'),
    path('projects/<int:project_id>/database-schema/dismiss-proposal/', ProjectDatabaseSchemaProposalDismissView.as_view(), name='project-database-schema-dismiss-proposal'),
    path('projects/<int:project_id>/database-schema/refresh-proposal/', ProjectDatabaseSchemaProposalRefreshView.as_view(), name='project-database-schema-refresh-proposal'),
]
