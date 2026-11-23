from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from projects.models import Project
from ..models import Roadmap, RoadmapWhiteboard
from ..serializers import RoadmapWhiteboardSerializer
from ..services import WhiteboardService

class ProjectRoadmapWhiteboardDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, user=request.user)
        try:
            roadmap = project.roadmap
        except Roadmap.DoesNotExist:
            return Response({'exists': False, 'whiteboard': None}, status=status.HTTP_200_OK)

        try:
            whiteboard = roadmap.whiteboard
            existing_phase_ids = {
                n.get('data', {}).get('phaseId')
                for n in (whiteboard.nodes or [])
                if isinstance(n, dict) and n.get('data', {}).get('phaseId')
            }
            roadmap_phase_ids = set(roadmap.phases.values_list('id', flat=True))
            if roadmap_phase_ids and not roadmap_phase_ids.issubset(existing_phase_ids):
                whiteboard = WhiteboardService.generate_initial_whiteboard(roadmap)
        except RoadmapWhiteboard.DoesNotExist:
            whiteboard = WhiteboardService.generate_initial_whiteboard(roadmap)

        serializer = RoadmapWhiteboardSerializer(whiteboard)
        return Response({'exists': True, 'whiteboard': serializer.data}, status=status.HTTP_200_OK)

    def put(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, user=request.user)
        try:
            roadmap = project.roadmap
        except Roadmap.DoesNotExist:
            return Response(
                {'error': 'Roadmap does not exist for this project.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        whiteboard, _ = RoadmapWhiteboard.objects.get_or_create(roadmap=roadmap)

        whiteboard.nodes = request.data.get('nodes', whiteboard.nodes)
        whiteboard.edges = request.data.get('edges', whiteboard.edges)
        viewport = request.data.get('viewport')
        if viewport:
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
        try:
            roadmap = project.roadmap
        except Roadmap.DoesNotExist:
            return Response(
                {'error': 'Roadmap does not exist for this project.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        whiteboard = WhiteboardService.generate_initial_whiteboard(roadmap)
        serializer = RoadmapWhiteboardSerializer(whiteboard)
        return Response(
            {
                'message': 'Whiteboard reset to initial layout.',
                'whiteboard': serializer.data,
            },
            status=status.HTTP_200_OK,
        )


