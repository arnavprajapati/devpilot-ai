import re
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from projects.models import Project
from projects.serializers import ProjectSerializer
from .models import (
    Roadmap,
    RoadmapMilestone,
    RoadmapPhase,
    RoadmapTask,
    RoadmapWhiteboard,
    ProjectDatabaseSchema,
)
from .serializers import (
    RoadmapSerializer,
    RoadmapWhiteboardSerializer,
    ProjectDatabaseSchemaSerializer,
)
from .services import GeminiRoadmapService, WhiteboardService, DatabaseSchemaService, RoadmapCopilotService


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
                {'error': 'Unable to generate roadmap. AI service is temporarily unavailable. Please try again.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        phases_data = roadmap_data.get('phases', [])
        if not phases_data or len(phases_data) < 2:
            return Response(
                {'error': 'Roadmap generation produced an incomplete or single-phase plan. Please try regenerating.'},
                status=status.HTTP_502_BAD_GATEWAY
            )

        with transaction.atomic():
            try:
                project.roadmap.delete()
            except Roadmap.DoesNotExist:
                pass

            roadmap = Roadmap.objects.create(
                project=project,
                title=roadmap_data.get('title') or f"{project.name} Development Roadmap",
                summary=roadmap_data.get('summary', ''),
            )

            for p_idx, phase_data in enumerate(phases_data, start=1):
                phase = RoadmapPhase.objects.create(
                    roadmap=roadmap,
                    title=phase_data.get('title', f"Phase {p_idx}"),
                    description=phase_data.get('description', ''),
                    duration=phase_data.get('duration', ''),
                    order=p_idx,
                )

                for m_idx, milestone_data in enumerate(phase_data.get('milestones', []), start=1):
                    milestone = RoadmapMilestone.objects.create(
                        phase=phase,
                        title=milestone_data.get('title', f"Milestone {m_idx}"),
                        description=milestone_data.get('description', ''),
                        order=m_idx,
                    )

                    for t_idx, task_data in enumerate(milestone_data.get('tasks', []), start=1):
                        RoadmapTask.objects.create(
                            milestone=milestone,
                            title=task_data.get('title', f"Task {t_idx}"),
                            description=task_data.get('description', ''),
                            order=t_idx,
                        )

        serializer = RoadmapSerializer(roadmap)
        return Response(
            {
                'message': 'Roadmap generated successfully.',
                'roadmap': serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )


class ProjectRoadmapChatCopilotView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, user=request.user)
        try:
            roadmap = project.roadmap
        except Roadmap.DoesNotExist:
            return Response({'error': 'Roadmap does not exist for this project. Please generate one first.'}, status=status.HTTP_404_NOT_FOUND)

        prompt_text = request.data.get('prompt', '').strip()
        if not prompt_text:
            return Response({'error': 'Prompt is required.'}, status=status.HTTP_400_BAD_REQUEST)

        conversation_history = request.data.get('conversation_history', [])
        active_phase_id = request.data.get('active_phase_id')
        completed_task_ids = request.data.get('completed_task_ids', [])

        try:
            result = RoadmapCopilotService.chat(
                project=project,
                roadmap=roadmap,
                prompt_text=prompt_text,
                conversation_history=conversation_history,
                active_phase_id=active_phase_id,
                completed_task_ids=completed_task_ids,
            )
            return Response(result, status=status.HTTP_200_OK)
        except ValueError as err:
            return Response({'error': str(err)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as err:
            return Response({'error': str(err) if str(err) else 'Unable to process with AI Copilot. Please try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _sync_milestones_and_tasks(phase, milestones_data):
    existing_milestones = list(phase.milestones.all().order_by('order'))
    kept_milestone_ids = []
    used_milestone_ids = set()

    for m_idx, m_item in enumerate(milestones_data, start=1):
        m_title = (m_item.get('title') or f"Milestone {m_idx}").strip()
        m_desc = m_item.get('description', '')
        matched_m = None

        m_id = m_item.get('id')
        if m_id:
            for em in existing_milestones:
                if em.id == m_id and em.id not in used_milestone_ids:
                    matched_m = em
                    break

        if not matched_m:
            for em in existing_milestones:
                if em.title.strip().lower() == m_title.lower() and em.id not in used_milestone_ids:
                    matched_m = em
                    break

        if not matched_m and len(existing_milestones) == len(milestones_data):
            for em in existing_milestones:
                if em.order == m_idx and em.id not in used_milestone_ids:
                    matched_m = em
                    break

        if matched_m:
            used_milestone_ids.add(matched_m.id)
            matched_m.title = m_title
            matched_m.description = m_desc
            matched_m.order = m_idx
            matched_m.save()
            milestone = matched_m
        else:
            milestone = RoadmapMilestone.objects.create(
                phase=phase,
                title=m_title,
                description=m_desc,
                order=m_idx,
            )
        kept_milestone_ids.append(milestone.id)

        existing_tasks = list(milestone.tasks.all().order_by('order'))
        kept_task_ids = []
        used_task_ids = set()
        raw_tasks = m_item.get('tasks', [])

        for t_idx, t_item in enumerate(raw_tasks, start=1):
            t_title = (t_item.get('title') or f"Task {t_idx}").strip()
            t_desc = t_item.get('description', '')
            matched_t = None

            t_id = t_item.get('id')
            if t_id:
                for et in existing_tasks:
                    if et.id == t_id and et.id not in used_task_ids:
                        matched_t = et
                        break

            if not matched_t:
                for et in existing_tasks:
                    if et.title.strip().lower() == t_title.lower() and et.id not in used_task_ids:
                        matched_t = et
                        break

            if not matched_t and len(existing_tasks) == len(raw_tasks):
                for et in existing_tasks:
                    if et.order == t_idx and et.id not in used_task_ids:
                        matched_t = et
                        break

            if matched_t:
                used_task_ids.add(matched_t.id)
                matched_t.title = t_title
                matched_t.description = t_desc
                matched_t.order = t_idx
                matched_t.save()
                task = matched_t
            else:
                task = RoadmapTask.objects.create(
                    milestone=milestone,
                    title=t_title,
                    description=t_desc,
                    order=t_idx,
                )
            kept_task_ids.append(task.id)
        milestone.tasks.exclude(id__in=kept_task_ids).delete()
    phase.milestones.exclude(id__in=kept_milestone_ids).delete()


def _validate_and_sanitize_roadmap_consistency(roadmap):
    existing_phases = list(roadmap.phases.all().order_by('order'))
    auto_pat = re.compile(r'\b(?:auto(?:matic(?:ally)?)?[- ]+(?:upgrade|purchase|billing|charge)|automatically[- ]+charge)\b', re.I)
    for idx, p in enumerate(existing_phases, start=1):
        if p.order != idx:
            p.order = idx
            p.save()
        existing_milestones = list(p.milestones.all().order_by('order'))
        for m_idx, m in enumerate(existing_milestones, start=1):
            if m.order != m_idx:
                m.order = m_idx
                m.save()
            seen_task_titles = set()
            existing_tasks = list(m.tasks.all().order_by('order'))
            active_task_idx = 1
            for t in existing_tasks:
                clean_title = (t.title or '').strip().lower()
                if not clean_title or clean_title in seen_task_titles:
                    t.delete()
                    continue
                seen_task_titles.add(clean_title)
                changed_t = False
                if auto_pat.search(t.title):
                    t.title = auto_pat.sub('prompt upgrade and plan selection', t.title)
                    changed_t = True
                if auto_pat.search(t.description):
                    t.description = auto_pat.sub('prompt user with upgrade modal and plan selection options', t.description)
                    changed_t = True
                if t.order != active_task_idx:
                    t.order = active_task_idx
                    changed_t = True
                if changed_t:
                    t.save()
                active_task_idx += 1


class ProjectRoadmapApplyPhaseActionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, user=request.user)
        try:
            roadmap = project.roadmap
        except Roadmap.DoesNotExist:
            return Response({'error': 'Roadmap does not exist.'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')
        allowed_actions = ['add_phase', 'edit_phase', 'reorder_phase', 'delete_phase', 'update_tech_stack', 'update_roadmap']
        if action not in allowed_actions:
            return Response({'error': f"Unsupported action: '{action}'."}, status=status.HTTP_400_BAD_REQUEST)
        phase_data = request.data.get('phase_data') or {}
        target_phase_id = request.data.get('target_phase_id')
        target_phase_order = request.data.get('target_phase_order')

        with transaction.atomic():
            if action == 'add_phase':
                current_count = roadmap.phases.count()
                req_order = phase_data.get('order') or target_phase_order
                if req_order and 1 <= int(req_order) <= current_count + 1:
                    target_order = int(req_order)
                else:
                    last_phase = roadmap.phases.order_by('-order').first()
                    is_deployment = False
                    if last_phase and any(kw in last_phase.title.lower() for kw in ['deploy', 'polish', 'launch', 'release', 'production']):
                        is_deployment = True
                    if is_deployment and current_count >= 1:
                        target_order = last_phase.order
                    else:
                        target_order = current_count + 1

                for existing_p in roadmap.phases.filter(order__gte=target_order).order_by('-order'):
                    existing_p.order += 1
                    existing_p.save()

                phase = RoadmapPhase.objects.create(
                    roadmap=roadmap,
                    title=phase_data.get('title', f"Phase {target_order}"),
                    description=phase_data.get('description', ''),
                    duration=phase_data.get('duration', '2 Weeks'),
                    order=target_order,
                )
                for m_idx, m_item in enumerate(phase_data.get('milestones', []), start=1):
                    milestone = RoadmapMilestone.objects.create(
                        phase=phase,
                        title=m_item.get('title', f"Milestone {m_idx}"),
                        description=m_item.get('description', ''),
                        order=m_idx,
                    )
                    for t_idx, t_item in enumerate(m_item.get('tasks', []), start=1):
                        RoadmapTask.objects.create(
                            milestone=milestone,
                            title=t_item.get('title', f"Task {t_idx}"),
                            description=t_item.get('description', ''),
                            order=t_idx,
                        )

            elif action == 'edit_phase':
                phase = None
                phase_by_id = None
                phase_by_order = None

                if target_phase_id:
                    try:
                        phase_by_id = roadmap.phases.filter(id=int(target_phase_id)).first()
                    except (ValueError, TypeError):
                        pass

                if target_phase_order:
                    try:
                        phase_by_order = roadmap.phases.filter(order=int(target_phase_order)).first()
                    except (ValueError, TypeError):
                        pass

                if phase_by_order and phase_by_id and phase_by_id != phase_by_order:
                    phase = phase_by_order
                elif phase_by_id:
                    phase = phase_by_id
                elif phase_by_order:
                    phase = phase_by_order

                if not phase and phase_data.get('title'):
                    phase = roadmap.phases.filter(title__iexact=phase_data['title'].strip()).first()

                if not phase:
                    return Response({'error': f"Target phase not found in roadmap (target_phase_id={target_phase_id}, target_phase_order={target_phase_order})."}, status=status.HTTP_404_NOT_FOUND)

                if phase_data.get('title'):
                    phase.title = phase_data['title']
                if phase_data.get('description') is not None:
                    phase.description = phase_data['description']
                if phase_data.get('duration'):
                    phase.duration = phase_data['duration']
                phase.save()

                if phase_data.get('milestones'):
                    _sync_milestones_and_tasks(phase, phase_data['milestones'])

            elif action == 'reorder_phase':
                phase = None
                if target_phase_id:
                    phase = roadmap.phases.filter(id=target_phase_id).first()
                if not phase and target_phase_order:
                    phase = roadmap.phases.filter(order=target_phase_order).first()
                new_order = phase_data.get('order') or request.data.get('new_order')
                if phase and new_order:
                    new_order = max(1, min(int(new_order), roadmap.phases.count()))
                    old_order = phase.order
                    if new_order != old_order:
                        if new_order < old_order:
                            for p in roadmap.phases.filter(order__gte=new_order, order__lt=old_order).order_by('-order'):
                                p.order += 1
                                p.save()
                        else:
                            for p in roadmap.phases.filter(order__gt=old_order, order__lte=new_order).order_by('order'):
                                p.order -= 1
                                p.save()
                        phase.order = new_order
                        phase.save()

            elif action == 'delete_phase':
                phase = None
                if target_phase_id:
                    phase = roadmap.phases.filter(id=target_phase_id).first()
                if not phase and target_phase_order:
                    phase = roadmap.phases.filter(order=target_phase_order).first()

                if phase:
                    phase.delete()

            elif action in ['update_tech_stack', 'update_roadmap']:
                new_tech_stack = request.data.get('new_tech_stack')
                if new_tech_stack and str(new_tech_stack).strip():
                    project.tech_stack = str(new_tech_stack).strip()
                    project.save()

                affected_phases = request.data.get('affected_phases') or []
                if affected_phases:
                    existing_phases_count = roadmap.phases.count()
                    is_full_stack_replacement = (action == 'update_tech_stack' and len(affected_phases) >= existing_phases_count)
                    kept_phase_ids = []

                    for p_idx, p_item in enumerate(affected_phases, start=1):
                        if not isinstance(p_item, dict):
                            continue
                        p_title = (p_item.get('title') or '').strip()
                        p_desc = p_item.get('description', '')
                        p_dur = p_item.get('duration', '2 Weeks')
                        p_id = p_item.get('id') or p_item.get('target_phase_id')
                        p_order = p_item.get('order')

                        target_p = None
                        if p_id:
                            try:
                                target_p = roadmap.phases.filter(id=int(p_id)).first()
                            except (ValueError, TypeError):
                                pass

                        if not target_p and p_order:
                            try:
                                target_p = roadmap.phases.filter(order=int(p_order)).first()
                            except (ValueError, TypeError):
                                pass

                        if not target_p and p_title:
                            target_p = roadmap.phases.filter(title__iexact=p_title).first()

                        if not target_p and len(affected_phases) == 1 and target_phase_order:
                            try:
                                target_p = roadmap.phases.filter(order=int(target_phase_order)).first()
                            except (ValueError, TypeError):
                                pass

                        if not target_p and len(affected_phases) == 1 and target_phase_id:
                            try:
                                candidate = roadmap.phases.filter(id=int(target_phase_id)).first()
                                if candidate and (not p_title or candidate.title.strip().lower() == p_title.lower()):
                                    target_p = candidate
                            except (ValueError, TypeError):
                                pass

                        if target_p:
                            if p_title:
                                target_p.title = p_title
                            if p_desc is not None:
                                target_p.description = p_desc
                            if p_dur:
                                target_p.duration = p_dur
                            target_p.save()
                            kept_phase_ids.append(target_p.id)
                            if p_item.get('milestones'):
                                _sync_milestones_and_tasks(target_p, p_item['milestones'])
                        elif is_full_stack_replacement:
                            created_order = p_order if p_order else p_idx
                            new_phase = RoadmapPhase.objects.create(
                                roadmap=roadmap,
                                title=p_title or f"Phase {created_order}",
                                description=p_desc,
                                duration=p_dur,
                                order=created_order,
                            )
                            kept_phase_ids.append(new_phase.id)
                            if p_item.get('milestones'):
                                _sync_milestones_and_tasks(new_phase, p_item['milestones'])

                    if is_full_stack_replacement and kept_phase_ids:
                        roadmap.phases.exclude(id__in=kept_phase_ids).delete()

            _validate_and_sanitize_roadmap_consistency(roadmap)

            roadmap.refresh_from_db()
            WhiteboardService.generate_initial_whiteboard(roadmap)
            serializer = RoadmapSerializer(roadmap)
            return Response({
                'message': 'Roadmap updated successfully.',
                'roadmap': serializer.data,
                'project': ProjectSerializer(project).data,
            }, status=status.HTTP_200_OK)


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


class ProjectDatabaseSchemaDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, user=request.user)
        target_type = request.query_params.get('schema_type')

        try:
            if target_type:
                schema = ProjectDatabaseSchema.objects.get(project=project, schema_type=target_type)
            else:
                schema = ProjectDatabaseSchema.objects.filter(project=project).order_by('-updated_at').first()
                if not schema:
                    raise ProjectDatabaseSchema.DoesNotExist()
            serializer = ProjectDatabaseSchemaSerializer(schema)
            return Response({'exists': True, 'schema': serializer.data}, status=status.HTTP_200_OK)
        except ProjectDatabaseSchema.DoesNotExist:
            return Response({'exists': False, 'schema': None}, status=status.HTTP_200_OK)

    def put(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, user=request.user)
        target_type = request.data.get('schema_type') or request.query_params.get('schema_type')

        try:
            if target_type:
                schema = ProjectDatabaseSchema.objects.get(project=project, schema_type=target_type)
            else:
                schema = ProjectDatabaseSchema.objects.filter(project=project).order_by('-updated_at').first()
                if not schema:
                    raise ProjectDatabaseSchema.DoesNotExist()
        except ProjectDatabaseSchema.DoesNotExist:
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
        forced_type = request.data.get('schema_type')

        try:
            data = DatabaseSchemaService.generate_schema_data(project, forced_type=forced_type)
        except ValueError as err:
            return Response({'error': str(err)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response(
                {'error': 'Unable to generate database schema. AI service is temporarily unavailable.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        schema_type = data.get('schema_type', 'table')
        tables = data.get('tables', [])
        db_engine = data.get('db_engine', 'PostgreSQL')
        sql_ddl = data.get('sql_ddl', '')
        nosql_code = data.get('nosql_code', '')

        nodes, edges = DatabaseSchemaService.build_layout(schema_type, tables, db_engine)

        with transaction.atomic():
            schema, _ = ProjectDatabaseSchema.objects.update_or_create(
                project=project,
                schema_type=schema_type,
                defaults={
                    'db_engine': db_engine,
                    'tables': tables,
                    'nodes': nodes,
                    'edges': edges,
                    'sql_ddl': sql_ddl,
                    'nosql_code': nosql_code,
                    'is_customized': False,
                },
            )

        serializer = ProjectDatabaseSchemaSerializer(schema)
        return Response(
            {
                'message': 'Database schema generated successfully.',
                'schema': serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )


class ProjectDatabaseSchemaResetView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, user=request.user)
        target_type = request.data.get('schema_type') or request.query_params.get('schema_type')

        try:
            if target_type:
                schema = ProjectDatabaseSchema.objects.get(project=project, schema_type=target_type)
            else:
                schema = ProjectDatabaseSchema.objects.filter(project=project).order_by('-updated_at').first()
                if not schema:
                    raise ProjectDatabaseSchema.DoesNotExist()
        except ProjectDatabaseSchema.DoesNotExist:
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

        schema_type = request.data.get('schema_type', 'table')
        db_engine = request.data.get('db_engine') or ('MongoDB' if schema_type == 'document' else 'PostgreSQL')
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
