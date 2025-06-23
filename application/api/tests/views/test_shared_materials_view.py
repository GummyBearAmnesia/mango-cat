from django.test import TestCase
from django.urls import reverse
from api.models.user import User
from api.models.session_user import SessionUser
from api.models.study_session import StudySession
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from django.utils.timezone import now

"""
Tests for the Shared Materials view function
"""

class SharedMaterialsViewTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(firstname='test', lastname='user', email='test@123.com', description='hello', username='testuser', password='testpassword')
        self.client = APIClient()

        self.session = StudySession.objects.create(createdBy=self.user, sessionName="hello", endTime=None, roomCode='ABC123')
        self.session_user = SessionUser.objects.create(
            user=self.user,
            session=self.session,\
            # Still in session
            left_at=None  
        )
    
    def test_authenticated_user_with_active_session(self):
        """
        Test that an authenticated user with an active session receives session details
        """
        self.client.force_authenticate(user=self.user)
        response = self.client.get(reverse('get_current_session'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['session_id'], self.session.id)
        self.assertEqual(response.data['roomCode'], 'ABC123')
    
    def test_authenticated_user_with_no_active_session(self):
        """
        Test that an authenticated user with no active session gets a 404 response
        """
        self.session_user.left_at = now()
        self.session_user.save()
        
        self.client.force_authenticate(user=self.user)
        response = self.client.get(reverse('get_current_session'))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'No active session found')
    
    def test_unauthenticated_user(self):
        """
        Test that an unauthenticated user is denied access
        """
        response = self.client.get(reverse('get_current_session'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)



    