from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from projects.models import Project
from .models import Roadmap, RoadmapMilestone, RoadmapPhase, RoadmapTask, RoadmapWhiteboard
from .serializers import RoadmapSerializer, RoadmapWhiteboardSerializer
from .services import GeminiRoadmapService, WhiteboardService


class ProjectRoadmapDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, user=request.user)
        try:
            roadmap = project.roadmap
            serializer = RoadmapSerializer(roadmap)
            return Response({'exists': True, 'roadmap': serializer.data}, status=status.HTTP_200_OK)
        except Roadmap.DoesNotExist:
            return Response({'exists': False, 'roadmap': None}, status=status.HTTP_200_OK)


class ProjectRoadmapGenerateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, user=request.user)

        try:
            roadmap_data = GeminiRoadmapService.generate_roadmap(project)
        except ValueError as err:
            return Response({'error': str(err)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response(
                {'error': "Unable to generate roadmap. AI generation service is temporarily unavailable."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        with transaction.atomic():
            if hasattr(project, 'roadmap'):
                project.roadmap.delete()

            roadmap = Roadmap.objects.create(
                project=project,
                title=roadmap_data.get('title') or f"{project.name} Development Roadmap",
                summary=roadmap_data.get('summary', ''),
            )

            for p_idx, phase_data in enumerate(roadmap_data.get('phases', []), start=1):
                phase = RoadmapPhase.objects.create(
                    roadmap=roadmap,
                    title=phase_data.get('title', f"Phase {p_idx}"),
                    description=phase_data.get('description', ''),
                    duration=phase_data.get('duration', ''),
                    order=phase_data.get('order', p_idx),
                )

                for m_idx, milestone_data in enumerate(phase_data.get('milestones', []), start=1):
                    milestone = RoadmapMilestone.objects.create(
                        phase=phase,
                        title=milestone_data.get('title', f"Milestone {m_idx}"),
                        description=milestone_data.get('description', ''),
                        order=milestone_data.get('order', m_idx),
                    )

                    for t_idx, task_data in enumerate(milestone_data.get('tasks', []), start=1):
                        RoadmapTask.objects.create(
                            milestone=milestone,
                            title=task_data.get('title', f"Task {t_idx}"),
                            description=task_data.get('description', ''),
                            order=task_data.get('order', t_idx),
                        )

            WhiteboardService.generate_initial_whiteboard(roadmap)

        serializer = RoadmapSerializer(roadmap)
        return Response(
            {
                'message': 'Roadmap generated successfully.',
                'roadmap': serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )


class ProjectRoadmapWhiteboardDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, user=request.user)
        if not hasattr(project, 'roadmap'):
            return Response({'exists': False, 'whiteboard': None}, status=status.HTTP_200_OK)

        try:
            whiteboard = project.roadmap.whiteboard
        except RoadmapWhiteboard.DoesNotExist:
            whiteboard = WhiteboardService.generate_initial_whiteboard(project.roadmap)

        serializer = RoadmapWhiteboardSerializer(whiteboard)
        return Response({'exists': True, 'whiteboard': serializer.data}, status=status.HTTP_200_OK)

    def put(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, user=request.user)
        if not hasattr(project, 'roadmap'):
            return Response(
                {'error': 'Roadmap does not exist for this project.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        whiteboard, _ = RoadmapWhiteboard.objects.get_or_create(roadmap=project.roadmap)

        nodes = request.data.get('nodes', whiteboard.nodes)
        edges = request.data.get('edges', whiteboard.edges)
        viewport = request.data.get('viewport', whiteboard.viewport)

        whiteboard.nodes = nodes
        whiteboard.edges = edges
        whiteboard.viewport = viewport
        whiteboard.is_customized = True
        whiteboard.save()

        serializer = RoadmapWhiteboardSerializer(whiteboard)
        return Response(
            {
                'message': 'Whiteboard saved successfully.',
                'whiteboard': serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class ProjectRoadmapWhiteboardResetView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, user=request.user)
        if not hasattr(project, 'roadmap'):
            return Response(
                {'error': 'Roadmap does not exist for this project.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        whiteboard = WhiteboardService.generate_initial_whiteboard(project.roadmap)
        serializer = RoadmapWhiteboardSerializer(whiteboard)
        return Response(
            {
                'message': 'Whiteboard reset to initial layout.',
                'whiteboard': serializer.data,
            },
            status=status.HTTP_200_OK,
        )
