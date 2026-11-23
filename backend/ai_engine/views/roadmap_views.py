import re
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from projects.models import Project
from projects.serializers import ProjectSerializer
from ..models import (
    Roadmap,
    RoadmapMilestone,
    RoadmapPhase,
    RoadmapTask,
    ProjectCopilotSession,
)
from ..serializers import RoadmapSerializer
from ..services import GeminiRoadmapService, RoadmapCopilotService, DatabaseSchemaService, WhiteboardService
from .sync_helpers import (
    _sync_milestones_and_tasks,
    _validate_and_sanitize_roadmap_consistency,
)

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

    def get(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, user=request.user)
        session, _ = ProjectCopilotSession.objects.get_or_create(project=project)
        return Response({
            'messages': session.messages,
            'confirmed_decisions': session.confirmed_decisions,
        }, status=status.HTTP_200_OK)

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, user=request.user)
        project.refresh_from_db()
        try:
            roadmap = project.roadmap
            roadmap.refresh_from_db()
        except Roadmap.DoesNotExist:
            return Response({'error': 'Roadmap does not exist for this project. Please generate one first.'}, status=status.HTTP_404_NOT_FOUND)

        prompt_text = request.data.get('prompt', '').strip()
        if not prompt_text:
            return Response({'error': 'Prompt is required.'}, status=status.HTTP_400_BAD_REQUEST)

        session, _ = ProjectCopilotSession.objects.get_or_create(project=project)
        prompt_lower = prompt_text.lower()
        if 'render' in prompt_lower and ('deploy' in prompt_lower or 'hosting' in prompt_lower):
            dec = "Deployment: Render simple deployment. Avoid AWS and Kubernetes."
            if dec not in session.confirmed_decisions:
                session.confirmed_decisions.append(dec)
        if any(w in prompt_lower for w in ['avoid', 'no ', 'remove', 'without']) and 'monitoring' in prompt_lower:
            dec = "Monitoring: Exclude Prometheus, Grafana, Datadog, and monitoring tasks."
            if dec not in session.confirmed_decisions:
                session.confirmed_decisions.append(dec)
        if any(w in prompt_lower for w in ['avoid', 'no ', 'remove', 'without']) and ('testing' in prompt_lower or 'tests' in prompt_lower):
            dec = "Testing: Exclude QA test suites, Jest, Cypress, and testing tasks."
            if dec not in session.confirmed_decisions:
                session.confirmed_decisions.append(dec)

        conversation_history = request.data.get('conversation_history', [])
        if not conversation_history and session.messages:
            conversation_history = [
                {'role': m.get('role', 'user'), 'content': m.get('content', '')}
                for m in session.messages[-12:]
            ]

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
                confirmed_decisions=session.confirmed_decisions,
            )
            session.messages.append({'role': 'user', 'content': prompt_text})
            session.messages.append({'role': 'assistant', 'content': result.get('explanation', ''), 'response': result})
            if len(session.messages) > 30:
                session.messages = session.messages[-30:]
            session.save()
            return Response(result, status=status.HTTP_200_OK)
        except ValueError as err:
            return Response({'error': str(err)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as err:
            return Response({'error': str(err) if str(err) else 'Unable to process with AI Copilot. Please try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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

        client_roadmap_version = request.data.get('roadmap_version')
        current_version = str(roadmap.updated_at.isoformat()) if roadmap.updated_at else None
        if client_roadmap_version and current_version and client_roadmap_version != current_version:
            return Response({
                'error': 'This proposal is outdated because the roadmap was modified after it was created. Please review the updated roadmap and request a new proposal.',
                'is_stale': True,
            }, status=status.HTTP_409_CONFLICT)

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

            session, _ = ProjectCopilotSession.objects.get_or_create(project=project)
            summary = request.data.get('change_summary') or request.data.get('reason')
            if summary and str(summary).strip() and str(summary).strip() not in session.confirmed_decisions:
                session.confirmed_decisions.append(str(summary).strip())
            if request.data.get('new_tech_stack'):
                session.confirmed_decisions.append(f"Updated Tech Stack: {request.data.get('new_tech_stack')}")
            session.save()

            roadmap.refresh_from_db()
            WhiteboardService.generate_initial_whiteboard(roadmap)
            DatabaseSchemaService.sync_proposal_with_roadmap(project, roadmap)
            serializer = RoadmapSerializer(roadmap)
            return Response({
                'message': 'Roadmap updated successfully.',
                'roadmap': serializer.data,
                'project': ProjectSerializer(project).data,
                'roadmap_version': str(roadmap.updated_at.isoformat()) if roadmap.updated_at else None,
            }, status=status.HTTP_200_OK)


