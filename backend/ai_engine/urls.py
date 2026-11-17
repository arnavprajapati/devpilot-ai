from django.urls import path
from .views import (
    ProjectRoadmapDetailView,
    ProjectRoadmapGenerateView,
    ProjectRoadmapWhiteboardDetailView,
    ProjectRoadmapWhiteboardResetView,
)

urlpatterns = [
    path('projects/<int:project_id>/roadmap/', ProjectRoadmapDetailView.as_view(), name='project-roadmap'),
    path('projects/<int:project_id>/roadmap/generate/', ProjectRoadmapGenerateView.as_view(), name='project-roadmap-generate'),
    path('projects/<int:project_id>/whiteboard/', ProjectRoadmapWhiteboardDetailView.as_view(), name='project-whiteboard'),
    path('projects/<int:project_id>/whiteboard/reset/', ProjectRoadmapWhiteboardResetView.as_view(), name='project-whiteboard-reset'),
]
