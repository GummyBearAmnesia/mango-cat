from django.test import TestCase, RequestFactory
from rest_framework.test import APIClient
from rest_framework import status

from api.models import StudySession, SessionUser, User
from api.views import get_participants

"""
Tests for the getParticipants view function
"""

class GetParticipantsViewTests(TestCase):
    fixtures = ['api/tests/fixtures/default_user.json']

    def setUp(self):
        self.url = '/api/login/'  
        self.user_data = {
            'email': 'alice@example.com',
            'password': 'Password123',
        }
        self.user = User.objects.get(username='@alice123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # Create a test study session
        self.study_session = StudySession.objects.create(createdBy=self.user, sessionName="Test Room")

        # Add participants to the study session
        self.participant1 = User.objects.create_user(firstname='test1', lastname='user', email='test1@123.com', description='hello', username='@testuser1', password='testpassword')
        self.participant2 = User.objects.create_user(firstname='test2', lastname='user', email='test2@123.com', description='hello', username='@testuser2', password='testpassword')
        self.study_session.participants.add(self.participant1, self.participant2)

    def test_get_participants_valid_room_code(self):
        """
        Test retrieving participants for a valid room code.
        """
        response = self.client.get(f"/api/get-participants/?roomCode={self.study_session.roomCode}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("participantsList", response.data)
        self.assertEqual(len(response.data["participantsList"]), 2) 

        # Verify the participants' usernames
        participants_usernames = [p["username"] for p in response.data["participantsList"]]
        self.assertIn("@testuser1", participants_usernames)
        self.assertIn("@testuser2", participants_usernames)

    def test_get_participants_invalid_room_code(self):
        """
        Test retrieving participants for an invalid room code.
        """
        response = self.client.get("/api/get-participants/?roomCode=INVALID_CODE")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)
        self.assertEqual(response.data["error"], "Failed to retrieve participants: StudySession matching query does not exist.")

    def test_get_participants_unauthenticated(self):
        """
        Test retrieving participants without authentication.
        """
        client = APIClient()  
        response = client.get(f"/api/get-participants/?roomCode={self.study_session.roomCode}")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)