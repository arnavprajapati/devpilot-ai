from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class AuthenticationTests(APITestCase):
    def setUp(self):
        self.register_url = reverse('register')
        self.login_url = reverse('login')
        self.logout_url = reverse('logout')
        self.me_url = reverse('current_user')
        self.csrf_url = reverse('csrf')

        self.valid_user_data = {
            'full_name': 'Dev Pilot',
            'email': 'developer@devpilot.ai',
            'password': 'StrongPassword123!',
            'confirm_password': 'StrongPassword123!',
        }

    def test_csrf_token_endpoint(self):
        response = self.client.get(self.csrf_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('csrfToken', response.data)
        self.assertTrue(len(response.data['csrfToken']) > 0)

    def test_registration_success(self):
        response = self.client.post(self.register_url, self.valid_user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user']['email'], 'developer@devpilot.ai')
        self.assertEqual(response.data['user']['full_name'], 'Dev Pilot')

        me_response = self.client.get(self.me_url)
        self.assertEqual(me_response.status_code, status.HTTP_200_OK)
        self.assertTrue(me_response.data['isAuthenticated'])
        self.assertEqual(me_response.data['user']['email'], 'developer@devpilot.ai')

    def test_registration_password_mismatch(self):
        data = self.valid_user_data.copy()
        data['confirm_password'] = 'DifferentPassword123!'
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('confirm_password', response.data)

    def test_registration_short_password(self):
        data = self.valid_user_data.copy()
        data['password'] = 'short'
        data['confirm_password'] = 'short'
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_registration_duplicate_email(self):
        self.client.post(self.register_url, self.valid_user_data, format='json')
        response = self.client.post(self.register_url, self.valid_user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_login_success(self):
        User.objects.create_user(
            username='developer@devpilot.ai',
            email='developer@devpilot.ai',
            password='StrongPassword123!',
            first_name='Dev Pilot'
        )

        login_data = {
            'email': 'developer@devpilot.ai',
            'password': 'StrongPassword123!'
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['email'], 'developer@devpilot.ai')

        me_response = self.client.get(self.me_url)
        self.assertEqual(me_response.status_code, status.HTTP_200_OK)
        self.assertTrue(me_response.data['isAuthenticated'])

    def test_login_invalid_password(self):
        User.objects.create_user(
            username='developer@devpilot.ai',
            email='developer@devpilot.ai',
            password='StrongPassword123!',
            first_name='Dev Pilot'
        )

        login_data = {
            'email': 'developer@devpilot.ai',
            'password': 'WrongPassword123!'
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_nonexistent_email(self):
        login_data = {
            'email': 'notfound@devpilot.ai',
            'password': 'AnyPassword123!'
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_logout(self):
        self.client.post(self.register_url, self.valid_user_data, format='json')
        logout_response = self.client.post(self.logout_url)
        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)

        me_response = self.client.get(self.me_url)
        self.assertEqual(me_response.status_code, status.HTTP_200_OK)
        self.assertFalse(me_response.data['isAuthenticated'])
        self.assertIsNone(me_response.data['user'])
