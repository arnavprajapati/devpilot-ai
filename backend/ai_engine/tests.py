from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from projects.models import Project
from .models import Roadmap, RoadmapMilestone, RoadmapPhase, RoadmapTask

User = get_user_model()


class RoadmapAPITests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username='user1@devpilot.ai',
            email='user1@devpilot.ai',
            password='Password123!',
            first_name='User One',
        )
        self.user2 = User.objects.create_user(
            username='user2@devpilot.ai',
            email='user2@devpilot.ai',
            password='Password123!',
            first_name='User Two',
        )

        self.project1 = Project.objects.create(
            user=self.user1,
            name='CloudOps Engine',
            description='Telemetry ingestion with AI anomaly detection',
            requirements='FastAPI, Redis, Docker',
            tech_stack='Python, FastAPI, Redis, Docker',
            status='Planning',
        )

        self.detail_url = reverse('project-roadmap', kwargs={'project_id': self.project1.id})
        self.generate_url = reverse('project-roadmap-generate', kwargs={'project_id': self.project1.id})

        self.mock_gemini_response = {
            'title': 'CloudOps Engine Architecture & Roadmap',
            'summary': 'Multi-phase implementation plan for high throughput telemetry and AI detection.',
            'phases': [
                {
                    'title': 'Phase 1: Foundation & Data Ingestion',
                    'description': 'Core architecture, Redis queues, and telemetry validation.',
                    'duration': 'Weeks 1-2',
                    'order': 1,
                    'milestones': [
                        {
                            'title': 'Milestone 1.1: Core API & Redis Setup',
                            'description': 'Setup FastAPI container and Redis queue connection.',
                            'order': 1,
                            'tasks': [
                                {
                                    'title': 'Setup Docker Compose with Redis',
                                    'description': 'Configure container networking and persistent volumes.',
                                    'order': 1,
                                },
                                {
                                    'title': 'Build FastAPI telemetry ingestion endpoint',
                                    'description': 'Implement Pydantic payload models and rate limiting.',
                                    'order': 2,
                                },
                            ],
                        }
                    ],
                },
                {
                    'title': 'Phase 2: AI Anomaly Detection Engine',
                    'description': 'Deploy anomaly detection models on telemetry stream.',
                    'duration': 'Weeks 3-4',
                    'order': 2,
                    'milestones': [
                        {
                            'title': 'Milestone 2.1: Model Integration',
                            'description': 'Load model weights and test stream scoring.',
                            'order': 1,
                            'tasks': [
                                {
                                    'title': 'Implement isolation forest scoring worker',
                                    'description': 'Process stream batches from Redis asynchronously.',
                                    'order': 1,
                                }
                            ],
                        }
                    ],
                },
            ],
        }

    def test_unauthenticated_roadmap_access_rejected(self):
        response = self.client.get(self.detail_url)
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_get_roadmap_when_none_exists(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['exists'])
        self.assertIsNone(response.data['roadmap'])

    @patch('ai_engine.views.GeminiRoadmapService.generate_roadmap')
    def test_generate_roadmap_success(self, mock_generate):
        mock_generate.return_value = self.mock_gemini_response
        self.client.force_authenticate(user=self.user1)

        response = self.client.post(self.generate_url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('roadmap', response.data)
        self.assertEqual(response.data['roadmap']['title'], 'CloudOps Engine Architecture & Roadmap')

        self.assertTrue(Roadmap.objects.filter(project=self.project1).exists())
        self.assertEqual(RoadmapPhase.objects.filter(roadmap__project=self.project1).count(), 2)
        self.assertEqual(RoadmapMilestone.objects.filter(phase__roadmap__project=self.project1).count(), 2)
        self.assertEqual(RoadmapTask.objects.filter(milestone__phase__roadmap__project=self.project1).count(), 3)

    @patch('ai_engine.views.GeminiRoadmapService.generate_roadmap')
    def test_roadmap_persistence_after_generation(self, mock_generate):
        mock_generate.return_value = self.mock_gemini_response
        self.client.force_authenticate(user=self.user1)

        self.client.post(self.generate_url)

        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['exists'])
        roadmap_data = response.data['roadmap']
        self.assertEqual(len(roadmap_data['phases']), 2)
        self.assertEqual(roadmap_data['phases'][0]['title'], 'Phase 1: Foundation & Data Ingestion')
        self.assertEqual(len(roadmap_data['phases'][0]['milestones']), 1)
        self.assertEqual(len(roadmap_data['phases'][0]['milestones'][0]['tasks']), 2)

    @patch('ai_engine.views.GeminiRoadmapService.generate_roadmap')
    def test_regenerate_roadmap_replaces_old(self, mock_generate):
        mock_generate.return_value = self.mock_gemini_response
        self.client.force_authenticate(user=self.user1)
        self.client.post(self.generate_url)

        updated_gemini_response = self.mock_gemini_response.copy()
        updated_gemini_response['title'] = 'Regenerated CloudOps Roadmap v2'
        mock_generate.return_value = updated_gemini_response

        response = self.client.post(self.generate_url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['roadmap']['title'], 'Regenerated CloudOps Roadmap v2')
        self.assertEqual(Roadmap.objects.filter(project=self.project1).count(), 1)

    @patch('ai_engine.views.GeminiRoadmapService.generate_roadmap')
    def test_gemini_failure_preserves_existing_roadmap(self, mock_generate):
        mock_generate.return_value = self.mock_gemini_response
        self.client.force_authenticate(user=self.user1)
        self.client.post(self.generate_url)

        initial_roadmap = Roadmap.objects.get(project=self.project1)
        initial_title = initial_roadmap.title

        mock_generate.side_effect = RuntimeError("Gemini API connection timeout")
        response = self.client.post(self.generate_url)
        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)

        current_roadmap = Roadmap.objects.get(project=self.project1)
        self.assertEqual(current_roadmap.id, initial_roadmap.id)
        self.assertEqual(current_roadmap.title, initial_title)

    @patch('ai_engine.views.GeminiRoadmapService.generate_roadmap')
    def test_missing_api_key_error(self, mock_generate):
        mock_generate.side_effect = ValueError("Gemini API key is not configured.")
        self.client.force_authenticate(user=self.user1)

        response = self.client.post(self.generate_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Gemini API key is not configured', response.data['error'])

    def test_user_cannot_view_other_user_roadmap(self):
        self.client.force_authenticate(user=self.user2)
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_user_cannot_generate_other_user_roadmap(self):
        self.client.force_authenticate(user=self.user2)
        response = self.client.post(self.generate_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    @patch('ai_engine.views.GeminiRoadmapService.generate_roadmap')
    def test_get_whiteboard_auto_generates_nodes_and_edges(self, mock_generate):
        mock_generate.return_value = self.mock_gemini_response
        self.client.force_authenticate(user=self.user1)
        self.client.post(self.generate_url)

        whiteboard_url = reverse('project-whiteboard', kwargs={'project_id': self.project1.id})
        response = self.client.get(whiteboard_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['exists'])
        whiteboard = response.data['whiteboard']
        self.assertGreater(len(whiteboard['nodes']), 0)
        self.assertGreater(len(whiteboard['edges']), 0)
        self.assertFalse(whiteboard['is_customized'])

    @patch('ai_engine.views.GeminiRoadmapService.generate_roadmap')
    def test_update_whiteboard_persists_customized_state(self, mock_generate):
        mock_generate.return_value = self.mock_gemini_response
        self.client.force_authenticate(user=self.user1)
        self.client.post(self.generate_url)

        whiteboard_url = reverse('project-whiteboard', kwargs={'project_id': self.project1.id})
        custom_nodes = [{'id': 'custom-1', 'position': {'x': 100, 'y': 100}, 'data': {'title': 'Custom Architecture Node'}}]
        custom_edges = [{'id': 'e-1', 'source': 'custom-1', 'target': 'phase-1'}]
        response = self.client.put(
            whiteboard_url,
            {'nodes': custom_nodes, 'edges': custom_edges, 'viewport': {'x': 10, 'y': 20, 'zoom': 1.2}},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['whiteboard']['is_customized'])
        self.assertEqual(len(response.data['whiteboard']['nodes']), 1)

    @patch('ai_engine.views.GeminiRoadmapService.generate_roadmap')
    def test_reset_whiteboard_restores_default_layout(self, mock_generate):
        mock_generate.return_value = self.mock_gemini_response
        self.client.force_authenticate(user=self.user1)
        self.client.post(self.generate_url)

        whiteboard_url = reverse('project-whiteboard', kwargs={'project_id': self.project1.id})
        reset_url = reverse('project-whiteboard-reset', kwargs={'project_id': self.project1.id})

        self.client.put(
            whiteboard_url,
            {'nodes': [{'id': 'c1', 'data': {'title': 'Modified'}}], 'edges': []},
            format='json',
        )

        response = self.client.post(reset_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['whiteboard']['is_customized'])
        self.assertGreater(len(response.data['whiteboard']['nodes']), 1)

    def test_user_cannot_access_other_user_whiteboard(self):
        whiteboard_url = reverse('project-whiteboard', kwargs={'project_id': self.project1.id})
        self.client.force_authenticate(user=self.user2)
        response = self.client.get(whiteboard_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_generated_phase_schema_omitted_order_is_none(self):
        from ai_engine.services import GeneratedPhaseSchema
        phase = GeneratedPhaseSchema(title="Security Hardening")
        self.assertIsNone(phase.order)

    def test_roadmap_copilot_response_action_validation(self):
        from ai_engine.services import RoadmapCopilotResponse
        from pydantic import ValidationError
        valid = RoadmapCopilotResponse(action="add_phase")
        self.assertEqual(valid.action, "add_phase")
        with self.assertRaises(ValidationError):
            RoadmapCopilotResponse(action="invalid_action")

    def test_groq_service_credentials_independent_of_gemini(self):
        from ai_engine.services import GroqService
        from django.test import override_settings
        with override_settings(GROQ_API_KEY='gsk_test123', GEMINI_API_KEY='gemini_val'):
            self.assertEqual(GroqService.get_api_key(), 'gsk_test123')
            self.assertTrue(GroqService.is_available())
        with override_settings(GROQ_API_KEY=''):
            with patch.dict('os.environ', {'GROQ_API_KEY': 'gsk_env_key', 'GEMINI_API_KEY': 'gemini_val'}):
                self.assertEqual(GroqService.get_api_key(), 'gsk_env_key')
                self.assertTrue(GroqService.is_available())
        with override_settings(GROQ_API_KEY=''):
            with patch.dict('os.environ', {'GROQ_API_KEY': '', 'GEMINI_API_KEY': 'gemini_val'}, clear=True):
                self.assertEqual(GroqService.get_api_key(), '')
                self.assertFalse(GroqService.is_available())

    def test_build_layout_rejects_duplicate_entity_names(self):
        from ai_engine.services import DatabaseSchemaService
        tables = [
            {'name': 'users', 'columns': []},
            {'name': 'Users', 'columns': []},
        ]
        with self.assertRaises(ValueError):
            DatabaseSchemaService.build_layout('table', tables, 'PostgreSQL')

    def test_build_layout_includes_self_referencing_foreign_keys(self):
        from ai_engine.services import DatabaseSchemaService
        tables = [
            {
                'name': 'tasks',
                'columns': [
                    {'name': 'id', 'is_primary': True},
                    {'name': 'parent_id', 'is_foreign': True, 'references': 'tasks.id'},
                ],
            }
        ]
        nodes, edges = DatabaseSchemaService.build_layout('table', tables, 'PostgreSQL')
        self.assertEqual(len(nodes), 1)
        self.assertEqual(len(edges), 1)
        self.assertEqual(edges[0]['source'], 'db-tasks')
        self.assertEqual(edges[0]['target'], 'db-tasks')

    def test_normalize_copilot_data_preserves_omitted_order_as_none(self):
        from ai_engine.services import RoadmapCopilotService
        data = {
            'action': 'add_phase',
            'phase_data': {
                'title': 'New Feature Phase',
                'milestones': [],
            },
        }
        normalized = RoadmapCopilotService._normalize_copilot_data(data)
        self.assertIsNone(normalized['phase_data']['order'])

    def test_quota_limits_prompt_upgrade_selection_not_auto_charge(self):
        from ai_engine.services import GeminiRoadmapService
        from ai_engine.views import _validate_and_sanitize_roadmap_consistency
        raw_data = {
            'title': 'Test Roadmap',
            'summary': 'Test Summary',
            'phases': [
                {
                    'phase_number': 1,
                    'title': 'Phase 1',
                    'description': 'Foundation',
                    'duration': '2 Weeks',
                    'milestones': [{'title': 'M1', 'description': 'M1 desc', 'order': 1, 'tasks': [{'title': 'Setup DB', 'description': 'Configure DB', 'order': 1}]}]
                },
                {
                    'phase_number': 2,
                    'title': 'Phase 2',
                    'description': 'Features',
                    'duration': '2 Weeks',
                    'milestones': [{'title': 'M2', 'description': 'M2 desc', 'order': 1, 'tasks': [{'title': 'Auto-upgrade user to paid tier', 'description': 'Automatically charge card when 5 GB exceeded', 'order': 1}]}]
                },
                {
                    'phase_number': 3,
                    'title': 'Phase 3',
                    'description': 'Deploy',
                    'duration': '2 Weeks',
                    'milestones': [{'title': 'M3', 'description': 'M3 desc', 'order': 1, 'tasks': [{'title': 'Deploy to Cloud', 'description': 'Release app', 'order': 1}]}]
                }
            ]
        }
        validated = GeminiRoadmapService._validate_roadmap_structure(raw_data)
        p2_task = validated['phases'][1]['milestones'][0]['tasks'][0]
        self.assertNotIn('auto-upgrade', p2_task['title'].lower())
        self.assertNotIn('automatically charge', p2_task['description'].lower())
        self.assertIn('prompt upgrade and plan selection', p2_task['title'].lower())

        roadmap = Roadmap.objects.create(
            project=self.project1,
            title='Test Roadmap',
            summary='Test summary',
        )
        phase2 = RoadmapPhase.objects.create(
            roadmap=roadmap,
            title='Phase 2: Storage Management',
            description='File operations',
            duration='2 Weeks',
            order=2,
        )
        m = RoadmapMilestone.objects.create(
            phase=phase2,
            title='Storage limits',
            description='Enforce 5GB quota',
            order=1,
        )
        task = m.tasks.create(title='Auto-upgrade user on limit', description='Automatically charge account when quota reached', order=1)
        _validate_and_sanitize_roadmap_consistency(roadmap)
        task.refresh_from_db()
        self.assertNotIn('auto-upgrade', task.title.lower())
        self.assertNotIn('automatically charge', task.description.lower())

    def test_tech_stack_integrity_and_architectural_prompt(self):
        from ai_engine.services import GeminiRoadmapService
        self.project1.tech_stack = 'React, Node.js, AWS S3, PostgreSQL'
        self.project1.save()
        prompt = GeminiRoadmapService._build_prompt(self.project1)
        self.assertIn('AWS S3', prompt)
        self.assertIn('Architecture Source of Truth', prompt)
        self.assertIn('Quota and Limit Rule', prompt)
        self.assertIn('NEVER generate automatic purchases', prompt)

    def test_generic_multi_phase_change_preserves_unrelated_phases_and_completed_tasks(self):
        from ai_engine.services import RoadmapCopilotService
        roadmap = Roadmap.objects.create(project=self.project1, title='Test Flow', summary='Flow test')
        p1 = RoadmapPhase.objects.create(roadmap=roadmap, title='Phase 1: Foundation', description='Setup', duration='1 Week', order=1)
        m1 = RoadmapMilestone.objects.create(phase=p1, title='Infrastructure', description='Base setup', order=1)
        t1 = m1.tasks.create(title='Init repo', description='Init Git', order=1)

        p2 = RoadmapPhase.objects.create(roadmap=roadmap, title='Phase 2: Core Features', description='Features', duration='2 Weeks', order=2)
        m2 = RoadmapMilestone.objects.create(phase=p2, title='Auth Module', description='User auth', order=1)
        t2_completed = m2.tasks.create(title='User Login API', description='JWT login', order=1)
        t2_pending = m2.tasks.create(title='User Profile API', description='Profile management', order=2)

        p3 = RoadmapPhase.objects.create(roadmap=roadmap, title='Phase 3: Deployment', description='Cloud launch', duration='1 Week', order=3)
        m3 = RoadmapMilestone.objects.create(phase=p3, title='Production Release', description='Release app', order=1)
        t3 = m3.tasks.create(title='Deploy containers', description='Kubernetes deploy', order=1)

        mock_ai_output = {
            'action': 'update_roadmap',
            'operation': 'update_roadmap',
            'reason': 'Add image upload capability across storage foundation and API layers',
            'change_summary': 'Added S3 storage bucket configuration in Phase 1 and multipart upload endpoint in Phase 2.',
            'explanation': 'Phase 1 and Phase 2 are updated to support image uploading. Please confirm to apply.',
            'affected_phases': [
                {
                    'id': p1.id,
                    'order': 1,
                    'title': 'Phase 1: Foundation & Storage',
                    'description': 'Setup and storage configuration',
                    'duration': '1 Week',
                    'milestones': [
                        {
                            'id': m1.id,
                            'title': 'Infrastructure',
                            'description': 'Base setup',
                            'order': 1,
                            'tasks': [
                                {'id': t1.id, 'title': 'Init repo', 'description': 'Init Git', 'order': 1, 'is_completed': True},
                                {'id': None, 'title': 'Configure Object Storage Bucket', 'description': 'Setup S3 bucket and CORS', 'order': 2, 'is_completed': False},
                            ]
                        }
                    ]
                },
                {
                    'id': p2.id,
                    'order': 2,
                    'title': 'Phase 2: Core Features & Uploads',
                    'description': 'Features and file upload API',
                    'duration': '2 Weeks',
                    'milestones': [
                        {
                            'id': m2.id,
                            'title': 'Auth & File APIs',
                            'description': 'User auth and files',
                            'order': 1,
                            'tasks': [
                                {'id': t2_completed.id, 'title': 'User Login API', 'description': 'JWT login', 'order': 1, 'is_completed': True},
                                {'id': t2_pending.id, 'title': 'User Profile API', 'description': 'Profile management', 'order': 2},
                                {'id': None, 'title': 'Implement Image Upload API', 'description': 'Multipart upload route with validation', 'order': 3},
                            ]
                        }
                    ]
                }
            ]
        }

        resolved = RoadmapCopilotService._apply_generic_roadmap_intent(
            roadmap=roadmap,
            data=mock_ai_output,
            prompt_text="Add image upload across backend",
            current_tech_stack=self.project1.tech_stack
        )
        self.assertEqual(resolved['action'], 'update_roadmap')
        self.assertEqual(len(resolved['affected_phases']), 2)

        p2_data = resolved['affected_phases'][1]
        t2_res_completed = next(t for t in p2_data['milestones'][0]['tasks'] if t['id'] == t2_completed.id)
        self.assertTrue(t2_res_completed['is_completed'])

        apply_url = reverse('project-roadmap-apply-action', kwargs={'project_id': self.project1.id})
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(apply_url, data={
            'action': 'update_roadmap',
            'affected_phases': resolved['affected_phases'],
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        t2_completed.refresh_from_db()
        self.assertEqual(t2_completed.title, 'User Login API')
        self.assertEqual(t2_completed.order, 1)

        p3.refresh_from_db()
        self.assertEqual(p3.title, 'Phase 3: Deployment')
        self.assertEqual(p3.milestones.count(), 1)
        self.assertEqual(p3.milestones.first().tasks.count(), 1)

    def test_explanation_request_is_read_only(self):
        from ai_engine.services import RoadmapCopilotService
        roadmap = Roadmap.objects.create(project=self.project1, title='Test Flow', summary='Flow test')
        mock_data = {'action': 'none', 'operation': 'explanation', 'explanation': 'Here is how Redis is used for caching.'}
        res = RoadmapCopilotService._apply_generic_roadmap_intent(
            roadmap=roadmap,
            data=mock_data,
            prompt_text="Explain how Redis caching works",
            current_tech_stack=self.project1.tech_stack
        )
        self.assertEqual(res['action'], 'none')
        self.assertEqual(res['operation'], 'explanation')
        self.assertIsNone(res.get('affected_phases'))
        self.assertIsNone(res.get('phase_data'))

    def test_ambiguous_request_returns_clarification(self):
        from ai_engine.services import RoadmapCopilotService
        roadmap = Roadmap.objects.create(project=self.project1, title='Test Flow', summary='Flow test')
        mock_data = {'action': 'none', 'operation': 'clarification', 'explanation': 'Which database do you want to switch to?'}
        res = RoadmapCopilotService._apply_generic_roadmap_intent(
            roadmap=roadmap,
            data=mock_data,
            prompt_text="change database",
            current_tech_stack=self.project1.tech_stack
        )
        self.assertEqual(res['action'], 'none')
        self.assertEqual(res['operation'], 'clarification')
        self.assertIn('?', res['explanation'])

    def test_copilot_session_continuity_and_isolation(self):
        from .models import ProjectCopilotSession
        from ai_engine.services import RoadmapCopilotService

        roadmap = Roadmap.objects.create(project=self.project1, title='Test Flow', summary='Flow test')
        RoadmapPhase.objects.create(roadmap=roadmap, title='Phase 1: Foundation', duration='2 Weeks', order=1)

        self.client.force_authenticate(user=self.user1)
        chat_url = reverse('project-roadmap-chat', kwargs={'project_id': self.project1.id})

        with patch.object(RoadmapCopilotService, 'chat') as mock_chat:
            mock_chat.return_value = {
                'explanation': 'I have scoped the plan for Render deployment and excluded monitoring/testing.',
                'action': 'none',
                'operation': 'explanation',
                'roadmap_version': str(roadmap.updated_at.isoformat()),
            }
            resp = self.client.post(chat_url, data={
                'prompt': 'We will deploy on Render simply. Avoid monitoring and testing completely.'
            }, format='json')
            self.assertEqual(resp.status_code, status.HTTP_200_OK)

        session = ProjectCopilotSession.objects.get(project=self.project1)
        self.assertEqual(len(session.messages), 2)
        self.assertTrue(any('Render' in d for d in session.confirmed_decisions))
        self.assertTrue(any('Monitoring' in d for d in session.confirmed_decisions))
        self.assertTrue(any('Testing' in d for d in session.confirmed_decisions))

        project2 = Project.objects.create(
            user=self.user1,
            name='Project 2 Isolation Check',
            description='Second project',
        )
        Roadmap.objects.create(project=project2, title='P2 Roadmap', summary='P2')
        p2_chat_url = reverse('project-roadmap-chat', kwargs={'project_id': project2.id})
        p2_get_resp = self.client.get(p2_chat_url)
        self.assertEqual(p2_get_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(p2_get_resp.data['messages'], [])
        self.assertEqual(p2_get_resp.data['confirmed_decisions'], [])

    def test_stale_proposal_conflict_rejection(self):
        roadmap = Roadmap.objects.create(project=self.project1, title='Test Flow', summary='Flow test')
        p1 = RoadmapPhase.objects.create(roadmap=roadmap, title='Phase 1: Foundation', duration='2 Weeks', order=1)

        stale_version = "2020-01-01T00:00:00"
        apply_url = reverse('project-roadmap-apply-action', kwargs={'project_id': self.project1.id})
        self.client.force_authenticate(user=self.user1)

        resp = self.client.post(apply_url, data={
            'action': 'edit_phase',
            'target_phase_id': p1.id,
            'phase_data': {'title': 'Phase 1: Modified Stale'},
            'roadmap_version': stale_version,
        }, format='json')

        self.assertEqual(resp.status_code, status.HTTP_409_CONFLICT)
        self.assertTrue(resp.data.get('is_stale'))
        p1.refresh_from_db()
        self.assertEqual(p1.title, 'Phase 1: Foundation')

    def test_schema_copilot_loads_roadmap_and_isolates_chat_history(self):
        from .models import ProjectCopilotSession, ProjectDatabaseSchema
        from ai_engine.services import DatabaseSchemaService

        roadmap = Roadmap.objects.create(project=self.project1, title='Test Flow', summary='Flow test')
        p1 = RoadmapPhase.objects.create(roadmap=roadmap, title='Phase 1: Foundation', duration='2 Weeks', order=1)
        m1 = RoadmapMilestone.objects.create(phase=p1, title='Milestone 1', order=1)
        RoadmapTask.objects.create(milestone=m1, title='Setup File Storage Table', order=1)

        session = ProjectCopilotSession.objects.create(
            project=self.project1,
            messages=[{'role': 'user', 'content': 'Roadmap only question'}],
            schema_messages=[{'role': 'user', 'content': 'Previous schema question'}],
            confirmed_decisions=['Deployment on Render']
        )

        schema = ProjectDatabaseSchema.objects.create(
            project=self.project1,
            schema_type='table',
            db_engine='PostgreSQL',
            tables=[{'name': 'users', 'columns': [{'name': 'id', 'data_type': 'UUID', 'is_primary': True}]}],
            nodes=[],
            edges=[]
        )

        with patch.object(DatabaseSchemaService, '_invoke_entity_llm') as mock_llm:
            mock_llm.return_value = {
                'explanation': 'Added file storage schema entity.',
                'primary_entity': {
                    'name': 'drive_files',
                    'columns': [
                        {'name': 'id', 'data_type': 'UUID', 'is_primary': True},
                        {'name': 'user_id', 'data_type': 'UUID', 'is_foreign': True, 'references': 'users.id'},
                        {'name': 'file_name', 'data_type': 'VARCHAR(255)'}
                    ]
                },
                'new_related_entities': [],
                'relationships': [{'source_table': 'drive_files', 'target_table': 'users', 'relationship_type': 'many-to-one', 'foreign_key_column': 'user_id'}]
            }
            res = DatabaseSchemaService.generate_entity_from_prompt(
                prompt_text="Create drive files table",
                schema_type='table',
                db_engine='PostgreSQL',
                project=self.project1
            )
            self.assertEqual(res['primary_entity']['name'], 'drive_files')

        session.refresh_from_db()
        self.assertEqual(len(session.messages), 1)
        self.assertEqual(session.messages[0]['content'], 'Roadmap only question')
        self.assertEqual(len(session.schema_messages), 3)

    def test_accepted_roadmap_change_creates_schema_proposal_and_applies_atomically(self):
        from .models import ProjectDatabaseSchema
        from ai_engine.services import DatabaseSchemaService

        roadmap = Roadmap.objects.create(project=self.project1, title='Test Flow', summary='Flow test')
        p1 = RoadmapPhase.objects.create(roadmap=roadmap, title='Phase 1: Storage', duration='2 Weeks', order=1)
        m1 = RoadmapMilestone.objects.create(phase=p1, title='Bucket Uploads', order=1)
        RoadmapTask.objects.create(milestone=m1, title='Store File Metadata in Database', order=1)

        schema = ProjectDatabaseSchema.objects.create(
            project=self.project1,
            schema_type='table',
            db_engine='PostgreSQL',
            tables=[{'name': 'users', 'columns': [{'name': 'id', 'data_type': 'UUID', 'is_primary': True}]}],
            nodes=[{'id': 'db-users', 'data': {'name': 'users'}}],
            edges=[]
        )

        mock_proposal = {
            'has_changes': True,
            'summary': 'Add drive files table for storage',
            'before_after_summary': 'Added drive_files table',
            'modeling_notes': 'SQL normalized table',
            'affected_entities': ['drive_files'],
            'proposed_tables': [
                {'name': 'users', 'columns': [{'name': 'id', 'data_type': 'UUID', 'is_primary': True}]},
                {'name': 'drive_files', 'columns': [{'name': 'id', 'data_type': 'UUID', 'is_primary': True}, {'name': 'user_id', 'data_type': 'UUID', 'is_foreign': True, 'references': 'users.id'}]}
            ],
            'sql_ddl': 'CREATE TABLE drive_files (id UUID PRIMARY KEY);',
            'nosql_code': ''
        }

        with patch.object(DatabaseSchemaService, '_invoke_proposal_llm', return_value=mock_proposal):
            proposal = DatabaseSchemaService.sync_proposal_with_roadmap(self.project1, roadmap)

        self.assertTrue(proposal.get('has_changes'))
        self.assertIn('drive_files', proposal.get('affected_entities', []))

        schema.refresh_from_db()
        self.assertTrue(schema.pending_proposal.get('has_changes'))
        self.assertEqual(schema.pending_proposal.get('roadmap_version'), str(roadmap.updated_at.isoformat()))

        apply_url = reverse('project-database-schema-apply-proposal', kwargs={'project_id': self.project1.id})
        self.client.force_authenticate(user=self.user1)
        apply_resp = self.client.post(apply_url, data={
            'schema_type': 'table',
            'roadmap_version': schema.pending_proposal.get('roadmap_version'),
        }, format='json')
        self.assertEqual(apply_resp.status_code, status.HTTP_200_OK)

        schema.refresh_from_db()
        self.assertFalse(schema.pending_proposal.get('has_changes', False))
        table_names = [t['name'] for t in schema.tables]
        self.assertIn('users', table_names)
        self.assertIn('drive_files', table_names)

    def test_accepted_roadmap_change_without_schema_impact(self):
        from .models import ProjectDatabaseSchema
        from ai_engine.services import DatabaseSchemaService

        roadmap = Roadmap.objects.create(project=self.project1, title='Test Flow', summary='Flow test')
        p1 = RoadmapPhase.objects.create(roadmap=roadmap, title='Phase 1: DevOps', duration='1 Week', order=1)
        m1 = RoadmapMilestone.objects.create(phase=p1, title='CI/CD Pipeline', order=1)
        RoadmapTask.objects.create(milestone=m1, title='Configure GitHub Actions and Linter', order=1)

        schema = ProjectDatabaseSchema.objects.create(
            project=self.project1,
            schema_type='table',
            db_engine='PostgreSQL',
            tables=[{'name': 'users', 'columns': [{'name': 'id', 'data_type': 'UUID', 'is_primary': True}]}],
            nodes=[],
            edges=[]
        )

        mock_no_impact = {
            'has_changes': False,
            'summary': 'No schema changes needed for CI/CD pipeline',
            'before_after_summary': '',
            'modeling_notes': '',
            'affected_entities': [],
            'proposed_tables': [],
            'sql_ddl': '',
            'nosql_code': ''
        }

        with patch.object(DatabaseSchemaService, '_invoke_proposal_llm', return_value=mock_no_impact):
            proposal = DatabaseSchemaService.sync_proposal_with_roadmap(self.project1, roadmap)

        self.assertFalse(proposal.get('has_changes'))

    def test_stale_schema_proposal_returns_409_conflict(self):
        from .models import ProjectDatabaseSchema

        roadmap = Roadmap.objects.create(project=self.project1, title='Test Flow', summary='Flow test')
        schema = ProjectDatabaseSchema.objects.create(
            project=self.project1,
            schema_type='table',
            db_engine='PostgreSQL',
            tables=[{'name': 'users', 'columns': []}],
            nodes=[],
            edges=[],
            pending_proposal={
                'has_changes': True,
                'roadmap_version': '2020-01-01T00:00:00',
                'summary': 'Add files table',
                'entities': [{'name': 'files', 'columns': []}]
            }
        )

        apply_url = reverse('project-database-schema-apply-proposal', kwargs={'project_id': self.project1.id})
        self.client.force_authenticate(user=self.user1)
        apply_resp = self.client.post(apply_url, data={
            'schema_type': 'table',
            'roadmap_version': '2020-01-01T00:00:00',
        }, format='json')
        self.assertEqual(apply_resp.status_code, status.HTTP_409_CONFLICT)
        self.assertTrue(apply_resp.data.get('is_stale'))

    def test_regenerate_builds_single_schema_proposal(self):
        from .models import ProjectDatabaseSchema
        from ai_engine.services import DatabaseSchemaService

        roadmap = Roadmap.objects.create(project=self.project1, title='Test Flow', summary='Flow test')
        p1 = RoadmapPhase.objects.create(roadmap=roadmap, title='Phase 1: Cloud Storage', duration='2 Weeks', order=1)
        m1 = RoadmapMilestone.objects.create(phase=p1, title='Bucket Infrastructure', order=1)
        RoadmapTask.objects.create(milestone=m1, title='S3 Upload API and Quota Tracking', order=1)

        ProjectDatabaseSchema.objects.create(
            project=self.project1,
            schema_type='table',
            db_engine='PostgreSQL',
            tables=[{'name': 'users', 'columns': [{'name': 'id', 'data_type': 'UUID', 'is_primary': True}]}],
            nodes=[],
            edges=[]
        )

        mock_proposal = {
            'summary': 'Cloud file storage domain with users, files, folders, and storage quotas.',
            'rationale': 'PostgreSQL schema handles transactional quotas and file relationships.',
            'db_engine': 'PostgreSQL',
            'schema_type': 'table',
            'tables': [
                {'name': 'users', 'description': 'User accounts', 'columns': [{'name': 'id', 'data_type': 'UUID', 'is_primary': True}, {'name': 'email', 'data_type': 'VARCHAR(255)'}]},
                {'name': 'drive_files', 'description': 'Uploaded files', 'columns': [{'name': 'id', 'data_type': 'UUID', 'is_primary': True}, {'name': 'user_id', 'data_type': 'UUID', 'is_foreign': True, 'references': 'users.id'}, {'name': 'size_bytes', 'data_type': 'INTEGER'}]}
            ],
            'code': 'CREATE TABLE users (id UUID PRIMARY KEY); CREATE TABLE drive_files (id UUID PRIMARY KEY, user_id UUID REFERENCES users(id));',
            'added_entities': ['drive_files'],
            'modified_entities': [],
            'preserved_entities': ['users'],
            'removed_entities': [],
            'modeling_notes': 'SQL normalized with foreign key references'
        }

        with patch.object(DatabaseSchemaService, '_invoke_single_proposal_llm', return_value=mock_proposal):
            proposal = DatabaseSchemaService.generate_regeneration_proposal(self.project1)

        self.assertEqual(proposal['summary'], 'Cloud file storage domain with users, files, folders, and storage quotas.')
        self.assertEqual(proposal['db_engine'], 'PostgreSQL')
        self.assertEqual(proposal['schema_type'], 'table')
        self.assertIn('drive_files', [t['name'] for t in proposal['tables']])
        self.assertIn('users', proposal['preserved_entities'])
        self.assertIn('drive_files', proposal['added_entities'])

    def test_confirm_regeneration_saves_single_schema_and_detects_stale_roadmap(self):
        from .models import ProjectDatabaseSchema

        roadmap = Roadmap.objects.create(project=self.project1, title='Test Flow', summary='Flow test')
        RoadmapPhase.objects.create(roadmap=roadmap, title='Phase 1: Storage', duration='2 Weeks', order=1)

        saved_schema = ProjectDatabaseSchema.objects.create(
            project=self.project1,
            schema_type='table',
            db_engine='PostgreSQL',
            tables=[{'name': 'users', 'columns': [{'name': 'id', 'data_type': 'UUID', 'is_primary': True}]}],
            nodes=[{'id': 'db-users', 'position': {'x': 100, 'y': 150}}],
            edges=[]
        )

        mock_proposal = {
            'summary': 'File storage architecture',
            'rationale': 'Unified data model',
            'db_engine': 'PostgreSQL',
            'schema_type': 'table',
            'roadmap_version': str(roadmap.updated_at.isoformat()),
            'schema_version': str(saved_schema.updated_at.isoformat()),
            'tables': [
                {'name': 'users', 'columns': [{'name': 'id', 'data_type': 'UUID', 'is_primary': True}]},
                {'name': 'files', 'columns': [{'name': 'id', 'data_type': 'UUID', 'is_primary': True}, {'name': 'user_id', 'data_type': 'UUID', 'is_foreign': True, 'references': 'users.id'}]}
            ],
            'added_entities': ['files'],
            'modified_entities': [],
            'preserved_entities': ['users'],
            'removed_entities': [],
            'code': 'CREATE TABLE files (id UUID PRIMARY KEY);',
            'modeling_notes': 'Normalized relational storage'
        }

        confirm_url = reverse('project-database-schema-confirm-regeneration', kwargs={'project_id': self.project1.id})
        self.client.force_authenticate(user=self.user1)

        resp = self.client.post(confirm_url, data={
            'proposal': mock_proposal,
            'roadmap_version': mock_proposal['roadmap_version'],
            'schema_version': mock_proposal['schema_version'],
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        saved_schema.refresh_from_db()
        self.assertEqual(len(saved_schema.tables), 2)
        self.assertIn('files', [t['name'] for t in saved_schema.tables])
        user_node = next(n for n in saved_schema.nodes if n['id'] == 'db-users')
        self.assertEqual(user_node['position'], {'x': 100, 'y': 150})

        stale_resp = self.client.post(confirm_url, data={
            'proposal': mock_proposal,
            'roadmap_version': '2019-01-01T00:00:00',
            'schema_version': mock_proposal['schema_version'],
        }, format='json')
        self.assertEqual(stale_resp.status_code, status.HTTP_409_CONFLICT)
        self.assertTrue(stale_resp.data.get('is_stale'))

    def test_project_isolation_in_regeneration(self):
        from .models import ProjectDatabaseSchema
        from ai_engine.services import DatabaseSchemaService

        project_chat = Project.objects.create(
            user=self.user1,
            name='TeamChat Messenger',
            description='A real-time messaging application with channels and direct messages.',
            tech_stack='React, Node.js, Socket.io, MongoDB, Redis',
            requirements='Group chat channels, private messaging, read receipts.',
        )
        ProjectDatabaseSchema.objects.create(
            project=project_chat,
            schema_type='document',
            db_engine='MongoDB',
            tables=[
                {'name': 'channels', 'columns': [{'name': '_id', 'data_type': 'ObjectId', 'is_primary': True}]},
                {'name': 'messages', 'columns': [{'name': '_id', 'data_type': 'ObjectId', 'is_primary': True}]},
            ],
            nodes=[],
            edges=[]
        )

        project_storage = Project.objects.create(
            user=self.user1,
            name='CloudVault Storage',
            description='Cloud storage platform for uploading and sharing documents and files.',
            tech_stack='React, Node.js, AWS S3, PostgreSQL',
            requirements='Upload files, organize into directories, share public links.',
        )
        ProjectDatabaseSchema.objects.create(
            project=project_storage,
            schema_type='table',
            db_engine='PostgreSQL',
            tables=[
                {'name': 'storage_drives', 'columns': [{'name': 'id', 'data_type': 'UUID', 'is_primary': True}]},
                {'name': 'vault_files', 'columns': [{'name': 'id', 'data_type': 'UUID', 'is_primary': True}]},
            ],
            nodes=[],
            edges=[]
        )

        storage_proposal = DatabaseSchemaService.generate_regeneration_proposal(project_storage)
        storage_names = [t['name'].lower() for t in storage_proposal['tables']]

        self.assertIn('storage_drives', storage_names)
        self.assertIn('vault_files', storage_names)
        self.assertNotIn('channels', storage_names)
        self.assertNotIn('messages', storage_names)

        chat_proposal = DatabaseSchemaService.generate_regeneration_proposal(project_chat)
        chat_names = [t['name'].lower() for t in chat_proposal['tables']]

        self.assertIn('channels', chat_names)
        self.assertIn('messages', chat_names)
        self.assertNotIn('storage_drives', chat_names)
        self.assertNotIn('vault_files', chat_names)

    def test_dynamic_schema_comparison_preserves_and_adds(self):
        from .models import ProjectDatabaseSchema
        from ai_engine.services import DatabaseSchemaService

        proj = Project.objects.create(
            user=self.user1,
            name='ProjectHub Specs',
            description='Software planning workspace with specs and documents.',
            tech_stack='React, Node.js, PostgreSQL',
            requirements='Document management, specs builder, team roles.',
        )
        ProjectDatabaseSchema.objects.create(
            project=proj,
            schema_type='table',
            db_engine='PostgreSQL',
            tables=[
                {'name': 'documents', 'columns': [{'name': 'id', 'data_type': 'UUID', 'is_primary': True}]},
                {'name': 'specifications', 'columns': [{'name': 'id', 'data_type': 'UUID', 'is_primary': True}]},
            ],
            nodes=[],
            edges=[]
        )

        proposal = DatabaseSchemaService.generate_regeneration_proposal(proj)
        preserved = [name.lower() for name in proposal['preserved_entities']]
        added = [name.lower() for name in proposal['added_entities']]

        self.assertIn('documents', preserved)
        self.assertIn('specifications', preserved)
        self.assertNotIn('documents', added)
        self.assertNotIn('specifications', added)

    def test_dynamic_technology_determination_and_unified_schema(self):
        from ai_engine.services import DatabaseSchemaService

        p_mongo = Project.objects.create(
            user=self.user1,
            name='NoSQL Project',
            description='MongoDB app',
            tech_stack='Node.js, Express, MongoDB, Mongoose',
        )
        engine_m, type_m, conflict_m, _ = DatabaseSchemaService.determine_database_technology(p_mongo)
        self.assertEqual(engine_m, 'MongoDB')
        self.assertEqual(type_m, 'document')
        self.assertFalse(conflict_m)

        p_pg = Project.objects.create(
            user=self.user1,
            name='SQL Project',
            description='PostgreSQL app',
            tech_stack='Python, Django, PostgreSQL',
        )
        engine_p, type_p, conflict_p, _ = DatabaseSchemaService.determine_database_technology(p_pg)
        self.assertEqual(engine_p, 'PostgreSQL')
        self.assertEqual(type_p, 'table')
        self.assertFalse(conflict_p)

        p_mysql = Project.objects.create(
            user=self.user1,
            name='MySQL Project',
            description='Laravel MySQL app',
            tech_stack='PHP, Laravel, MySQL',
        )
        engine_my, type_my, conflict_my, _ = DatabaseSchemaService.determine_database_technology(p_mysql)
        self.assertEqual(engine_my, 'MySQL')
        self.assertEqual(type_my, 'table')
        self.assertFalse(conflict_my)

        p_conflict = Project.objects.create(
            user=self.user1,
            name='Conflict Project',
            description='Dual database app',
            tech_stack='PostgreSQL, MongoDB',
        )
        engine_c, type_c, conflict_c, conflict_data = DatabaseSchemaService.determine_database_technology(p_conflict)
        self.assertTrue(conflict_c)
        self.assertIn('PostgreSQL', conflict_data.get('detected_engines', []))
        self.assertIn('MongoDB', conflict_data.get('detected_engines', []))

    def test_preservation_of_unrelated_existing_entities(self):
        from .models import ProjectDatabaseSchema
        from ai_engine.services import DatabaseSchemaService

        proj = Project.objects.create(
            user=self.user1,
            name='Analytics Engine',
            description='Telemetry ingestion and metrics reporting platform.',
            tech_stack='React, Go, PostgreSQL',
            requirements='Ingest time-series events, generate metrics aggregations.',
        )
        ProjectDatabaseSchema.objects.create(
            project=proj,
            schema_type='table',
            db_engine='PostgreSQL',
            tables=[
                {'name': 'custom_audit_logs', 'columns': [{'name': 'id', 'data_type': 'UUID', 'is_primary': True}]},
                {'name': 'api_access_keys', 'columns': [{'name': 'id', 'data_type': 'UUID', 'is_primary': True}]},
            ],
            nodes=[],
            edges=[]
        )

        proposal = DatabaseSchemaService.generate_regeneration_proposal(proj)
        names = [t['name'].lower() for t in proposal['tables']]

        self.assertIn('custom_audit_logs', names)
        self.assertIn('api_access_keys', names)
        self.assertNotIn('messages', names)
        self.assertNotIn('channels', names)
