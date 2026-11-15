from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Project

User = get_user_model()


class ProjectAPITests(APITestCase):
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

        self.list_url = reverse('project-list')

        self.project1 = Project.objects.create(
            user=self.user1,
            name='User 1 Project',
            description='Project description by user 1',
            requirements='Requirement 1',
            tech_stack='Django, React',
            status='Planning',
        )

    def test_unauthenticated_access_rejected(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_tech_stacks_endpoint(self):
        self.client.force_authenticate(user=self.user1)
        tech_stacks_url = reverse('project-tech-stacks')
        response = self.client.get(tech_stacks_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('categories', response.data)
        self.assertIn('popular', response.data)

    def test_list_projects_shows_only_user_projects(self):
        Project.objects.create(
            user=self.user2,
            name='User 2 Project',
            description='Project description by user 2',
            tech_stack='FastAPI',
            status='Planning',
        )

        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'User 1 Project')

    def test_create_project_success(self):
        self.client.force_authenticate(user=self.user1)
        payload = {
            'name': 'New AI Platform',
            'description': 'AI driven code assistant platform.',
            'requirements': 'OAuth2, PostgreSQL',
            'tech_stack': 'Next.js, Python, PostgreSQL',
        }
        response = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'New AI Platform')
        self.assertEqual(response.data['status'], 'Planning')
        self.assertIn('created_at', response.data)

        project = Project.objects.get(id=response.data['id'])
        self.assertEqual(project.user, self.user1)

    def test_create_project_validation_failure(self):
        self.client.force_authenticate(user=self.user1)
        payload = {
            'name': '',
            'description': '',
        }
        response = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)
        self.assertIn('description', response.data)

    def test_retrieve_project_details(self):
        self.client.force_authenticate(user=self.user1)
        detail_url = reverse('project-detail', kwargs={'pk': self.project1.id})
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.project1.id)
        self.assertEqual(response.data['name'], self.project1.name)
        self.assertEqual(response.data['status'], 'Planning')

    def test_update_project(self):
        self.client.force_authenticate(user=self.user1)
        detail_url = reverse('project-detail', kwargs={'pk': self.project1.id})
        payload = {
            'name': 'Updated Project Name',
            'description': 'Updated description',
            'requirements': 'Updated requirements',
            'tech_stack': 'Django, Vue.js',
            'status': 'In Progress',
        }
        response = self.client.put(detail_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated Project Name')
        self.assertEqual(response.data['status'], 'In Progress')

        self.project1.refresh_from_db()
        self.assertEqual(self.project1.name, 'Updated Project Name')
        self.assertEqual(self.project1.status, 'In Progress')

    def test_update_project_status_only(self):
        self.client.force_authenticate(user=self.user1)
        detail_url = reverse('project-detail', kwargs={'pk': self.project1.id})
        response = self.client.patch(detail_url, {'status': 'Completed'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'Completed')

    def test_delete_project(self):
        self.client.force_authenticate(user=self.user1)
        detail_url = reverse('project-detail', kwargs={'pk': self.project1.id})
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Project.objects.filter(id=self.project1.id).exists())

    def test_user_cannot_access_other_user_project(self):
        self.client.force_authenticate(user=self.user2)
        detail_url = reverse('project-detail', kwargs={'pk': self.project1.id})
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_user_cannot_modify_other_user_project(self):
        self.client.force_authenticate(user=self.user2)
        detail_url = reverse('project-detail', kwargs={'pk': self.project1.id})
        response = self.client.patch(detail_url, {'name': 'Hacked'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.project1.refresh_from_db()
        self.assertEqual(self.project1.name, 'User 1 Project')

    def test_user_cannot_delete_other_user_project(self):
        self.client.force_authenticate(user=self.user2)
        detail_url = reverse('project-detail', kwargs={'pk': self.project1.id})
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Project.objects.filter(id=self.project1.id).exists())
