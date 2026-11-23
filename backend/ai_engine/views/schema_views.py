from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from projects.models import Project
from ..models import ProjectDatabaseSchema
from ..serializers import ProjectDatabaseSchemaSerializer
from ..services import DatabaseSchemaService

class ProjectDatabaseSchemaDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, user=request.user)
        schema = getattr(project, 'database_schema', None)
        if not schema:
            schema = ProjectDatabaseSchema.objects.filter(project=project).first()
        if not schema:
            return Response({'exists': False, 'schema': None}, status=status.HTTP_200_OK)
        return Response({'exists': True, 'schema': ProjectDatabaseSchemaSerializer(schema).data}, status=status.HTTP_200_OK)

    def put(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, user=request.user)
        schema = getattr(project, 'database_schema', None)
        if not schema:
            schema = ProjectDatabaseSchema.objects.filter(project=project).first()
        if not schema:
            return Response(
                {'error': 'Database schema does not exist for this project.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        schema.nodes = request.data.get('nodes', schema.nodes)
        schema.edges = request.data.get('edges', schema.edges)
        schema.tables = request.data.get('tables', schema.tables)
        viewport = request.data.get('viewport')
        if viewport:
            schema.viewport = viewport
        schema.is_customized = True
        schema.save()

        serializer = ProjectDatabaseSchemaSerializer(schema)
        return Response(
            {
                'message': 'Database schema saved successfully.',
                'schema': serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class ProjectDatabaseSchemaGenerateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, user=request.user)
        action = request.data.get('action')

        if action == 'confirm':
            proposal = request.data.get('proposal') or {}
            client_roadmap_version = request.data.get('roadmap_version') or proposal.get('roadmap_version')
            client_schema_version = request.data.get('schema_version') or proposal.get('schema_version')
            try:
                schema = DatabaseSchemaService.apply_regeneration(
                    project=project,
                    proposal_data=proposal,
                    client_roadmap_version=client_roadmap_version,
                    client_schema_version=client_schema_version,
                )
                return Response({
                    'message': 'Database schema saved successfully.',
                    'schema': ProjectDatabaseSchemaSerializer(schema).data,
                }, status=status.HTTP_200_OK)
            except ValueError as err:
                if 'STALE_REGENERATION' in str(err):
                    return Response({'error': str(err), 'is_stale': True}, status=status.HTTP_409_CONFLICT)
                return Response({'error': str(err)}, status=status.HTTP_400_BAD_REQUEST)
            except Exception:
                return Response({'error': 'Failed to save regenerated database schema.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if action == 'preview':
            try:
                proposal = DatabaseSchemaService.generate_regeneration_proposal(project)
                return Response(proposal, status=status.HTTP_200_OK)
            except Exception:
                return Response({'error': 'Failed to generate schema proposal.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            schema = DatabaseSchemaService.generate_initial_schema(project)
            return Response({
                'message': 'Database schema generated successfully.',
                'schema': ProjectDatabaseSchemaSerializer(schema).data,
            }, status=status.HTTP_201_CREATED)
        except ValueError as err:
            return Response({'error': str(err)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response(
                {'error': 'Unable to generate database schema. AI service is temporarily unavailable.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )


class ProjectDatabaseSchemaConfirmRegenerationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, user=request.user)
        proposal = request.data.get('proposal') or {}
        client_roadmap_version = request.data.get('roadmap_version') or proposal.get('roadmap_version')
        client_schema_version = request.data.get('schema_version') or proposal.get('schema_version')
        try:
            schema = DatabaseSchemaService.apply_regeneration(
                project=project,
                proposal_data=proposal,
                client_roadmap_version=client_roadmap_version,
                client_schema_version=client_schema_version,
            )
            return Response({
                'message': 'Database schema saved successfully.',
                'schema': ProjectDatabaseSchemaSerializer(schema).data,
            }, status=status.HTTP_200_OK)
        except ValueError as err:
            if 'STALE_REGENERATION' in str(err):
                return Response({'error': str(err), 'is_stale': True}, status=status.HTTP_409_CONFLICT)
            return Response({'error': str(err)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response({'error': 'Failed to save regenerated database schema.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProjectDatabaseSchemaResetView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, user=request.user)
        schema = getattr(project, 'database_schema', None)
        if not schema:
            schema = ProjectDatabaseSchema.objects.filter(project=project).first()
        if not schema:
            return Response(
                {'error': 'Database schema does not exist for this project.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        nodes, edges = DatabaseSchemaService.build_layout(
            schema.schema_type,
            schema.tables,
            schema.db_engine,
        )
        schema.nodes = nodes
        schema.edges = edges
        schema.is_customized = False
        schema.save()

        serializer = ProjectDatabaseSchemaSerializer(schema)
        return Response(
            {
                'message': 'Database schema layout reset successfully.',
                'schema': serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class ProjectDatabaseSchemaGenerateEntityView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, user=request.user)
        prompt_text = request.data.get('prompt', '').strip()
        if not prompt_text:
            return Response({'error': 'Prompt is required.'}, status=status.HTTP_400_BAD_REQUEST)

        schema = getattr(project, 'database_schema', None)
        if not schema:
            schema = ProjectDatabaseSchema.objects.filter(project=project).first()

        schema_type = request.data.get('schema_type') or (schema.schema_type if schema else 'table')
        db_engine = request.data.get('db_engine') or (schema.db_engine if schema else 'PostgreSQL')
        current_entity = request.data.get('current_entity')

        try:
            entity_data = DatabaseSchemaService.generate_entity_from_prompt(
                prompt_text=prompt_text,
                schema_type=schema_type,
                db_engine=db_engine,
                current_entity=current_entity,
                project=project,
            )
            primary_entity = entity_data.get('primary_entity', entity_data)
            new_entities = entity_data.get('new_related_entities', [])
            relationships = entity_data.get('relationships', [])
            explanation = entity_data.get('explanation', '')
            return Response(
                {
                    'explanation': explanation,
                    'entity': primary_entity,
                    'new_entities': new_entities,
                    'relationships': relationships,
                },
                status=status.HTTP_200_OK,
            )
        except ValueError as err:
            return Response({'error': str(err)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response(
                {'error': 'AI service is temporarily unavailable.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )


class ProjectDatabaseSchemaProposalApplyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, user=request.user)
        client_roadmap_version = request.data.get('roadmap_version')
        try:
            schema = DatabaseSchemaService.apply_proposal(project, client_roadmap_version=client_roadmap_version)
            return Response(ProjectDatabaseSchemaSerializer(schema).data, status=status.HTTP_200_OK)
        except ValueError as err:
            if 'STALE_PROPOSAL' in str(err):
                return Response({'error': str(err), 'is_stale': True}, status=status.HTTP_409_CONFLICT)
            return Response({'error': str(err)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response({'error': 'Failed to apply schema proposal.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProjectDatabaseSchemaProposalDismissView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, user=request.user)
        try:
            schema = DatabaseSchemaService.dismiss_proposal(project)
            return Response(ProjectDatabaseSchemaSerializer(schema).data, status=status.HTTP_200_OK)
        except Exception:
            return Response({'error': 'Failed to dismiss proposal.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProjectDatabaseSchemaProposalRefreshView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, user=request.user)
        try:
            schema = DatabaseSchemaService.refresh_proposal(project)
            return Response(ProjectDatabaseSchemaSerializer(schema).data, status=status.HTTP_200_OK)
        except Exception:
            return Response({'error': 'Failed to refresh proposal.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

