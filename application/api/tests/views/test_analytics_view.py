from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

"""
Tests for the Analytics view
"""

class AnalyticsTestCase(APITestCase):

    def setUp(self):
        """
        Set up a test user with required fields (streaks, hours_studied, total_sessions)
        """
        self.user = User.objects.create_user(
            username="@testUser",
            firstname="test",
            lastname="user",
            email="testuser@email.com",
            description = "Testing",
            password="Test123",
            streaks=11,
            hours_studied=10,
            total_sessions=2
        )

        refresh = RefreshToken.for_user(self.user)
        self.token = str(refresh.access_token)

        ''' Authenticate the test user using Django’s test authentication '''
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_get_analytics_success(self):
        """
        Make a GET request to the get_analytics endpoint and check if the data recieved 
        is as expected
        """
        response = self.client.get('/api/analytics/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["streaks"], self.user.streaks)
        self.assertEqual(response.data["average_study_hours"], round(self.user.hours_studied / self.user.total_sessions, 2))

    def test_get_analytics_unauthenticated(self):
        """ 
        Test if error is thrown if we try to access the data without being authenticated
        """
        self.client.credentials()
        response = self.client.get('/api/analytics/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_shared_status(self):
        """
        Test if the function to toggle sharing analytics with friends works correctly
        """
        old_status = self.user.share_analytics
        response = self.client.patch('/api/share_analytics/')
        self.user.refresh_from_db()
        new_status = self.user.share_analytics
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotEqual(old_status, new_status)
