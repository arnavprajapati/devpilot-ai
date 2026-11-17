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
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

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
