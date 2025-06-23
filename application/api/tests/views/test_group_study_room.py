from django.contrib.auth.models import User
from django.test import TestCase, RequestFactory
from rest_framework.test import APIClient
from rest_framework import status
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.utils.timezone import now
from datetime import timedelta

from api.models import StudySession, SessionUser, User
from api.views import create_room, join_room, get_room_details, leave_room, notify_participants

"""
Tests for the Group Study room view functions
"""
class GroupStudyRoomViewsTests(TestCase):
    fixtures = ['api/tests/fixtures/default_user.json']

    def setUp(self):
        """Set up the test data"""
        self.url = '/api/login/' 
        self.user_data = {
            'email': 'alice@example.com',
            'password': 'Password123',
        }

        self.user = User.objects.get(username='@alice123')
        self.other_user = User.objects.get(username="@bob456")
        self.user_3 = User.objects.get(username="@john789")

        self.study_session = StudySession.objects.create(createdBy=self.user, sessionName="Test Room")

        self.client = APIClient()

        self.client.force_authenticate(user=self.user)

    def test_create_room(self):
        """
        Test creating a new study room.
        """
        data = {"sessionName": "New Study Room"}
        response = self.client.post("/api/create-room/", data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("roomCode", response.data)
        self.assertIn("roomList", response.data)

        # Verify the room was created in the database
        room = StudySession.objects.get(roomCode=response.data["roomCode"])
        self.assertEqual(room.sessionName, "New Study Room")
        self.assertEqual(room.createdBy, self.user)

    def test_create_room_unauthenticated(self):
        """
        Test creating a room without authentication.
        """
        client = APIClient()  # Unauthenticated client
        data = {"sessionName": "New Study Room"}
        response = client.post("/api/create-room/", data, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_join_room(self):
        """
        Test joining an existing study room.
        """
        data = {"roomCode": self.study_session.roomCode}
        response = self.client.post("/api/join-room/", data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Joined successfully!")

        # Verify the user was added to the room
        self.study_session.refresh_from_db()
        self.assertIn(self.user, self.study_session.participants.all())

    def test_join_room_not_found(self):
        """
        Test joining a non-existent room.
        """
        data = {"roomCode": "INVALID_CODE"}
        response = self.client.post("/api/join-room/", data, format="json")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["error"], "Room not found")

    def test_get_room_details(self):
        """
        Test retrieving details of a study room.
        """
        response = self.client.get(f"/api/get-room-details/?roomCode={self.study_session.roomCode}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["sessionName"], self.study_session.sessionName)
        self.assertEqual(response.data["roomList"], self.study_session.Task.id)

    def test_get_room_details_not_found(self):
        """
        Test retrieving details of a non-existent room.
        """
        response = self.client.get("/api/get-room-details/?roomCode=INVALID_CODE")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_leave_room(self):
        """Test leaving a study room successfully"""
        # Setup - add user to session
        self.study_session.participants.add(self.user)
        self.study_session.participants.add(self.other_user)
        session_user = SessionUser.objects.create(
            user=self.user,
            session=self.study_session
        )
        other_session_user = SessionUser.objects.create(
            user=self.other_user,
            session=self.study_session
        )
        
        self.client.force_authenticate(user=self.user)
        
        # Action - leave room
        response = self.client.post(
            '/api/leave-room/',
            {'roomCode': self.study_session.roomCode},
            format='json'
        )
        
        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify user was removed
        self.assertFalse(self.study_session.participants.filter(id=self.user.id).exists())
        
        # Verify session user was deleted
        with self.assertRaises(SessionUser.DoesNotExist):
            SessionUser.objects.get(user=self.user, session=self.study_session)
        
        # Verify room still exists (only destroyed when last participant leaves)
        self.assertTrue(StudySession.objects.filter(id=self.study_session.id).exists())

    def test_leave_room_destroys_when_empty(self):
        """Test room is destroyed when last participant leaves"""
        # Setup - add user as only participant
        self.study_session.participants.add(self.user)
        session_user = SessionUser.objects.create(
            user=self.user,
            session=self.study_session
        )
        
        self.client.force_authenticate(user=self.user)
        
        # Action - leave room
        response = self.client.post(
            '/api/leave-room/',
            {'roomCode': self.study_session.roomCode},
            format='json'
        )
        
        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify room was destroyed
        with self.assertRaises(StudySession.DoesNotExist):
            StudySession.objects.get(id=self.study_session.id)

    def test_leave_room_not_found(self):
        """
        Test leaving a non-existent room.
        """
        data = {"roomCode": "INVALID_CODE"}
        response = self.client.post("/api/leave-room/", data, format="json")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["error"], "Room not found")

    def test_create_room_updates_study_streak(self):
        """
        Test that creating a room updates the user's study streak.
        """
        self.user.last_study_date = now().date() - timedelta(days=1)    # When last joined yesterday
        self.user.streaks = 5
        self.user.save()

        data = {"sessionName": "New Study Room"}
        response = self.client.post("/api/create-room/", data, format="json")
        
        self.user.refresh_from_db()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.user.streaks, 6)  # Streak should increase

    def test_join_room_updates_study_streak(self):
        """
        Test that joining a room updates the user's study streak.
        """
        self.user.last_study_date = now().date() - timedelta(days=1)
        self.user.streaks = 3
        self.user.save()

        data = {"roomCode": self.study_session.roomCode}
        response = self.client.post("/api/join-room/", data, format="json")
        
        self.user.refresh_from_db()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.user.streaks, 4)  # Streak should increase
    
    def test_leave_room_does_not_update_study_streak(self):
        """
        Test that leaving a room does not affect the study streak.
        """
        self.user.last_study_date = now().date()
        self.user.streaks = 7
        self.user.save()
        
        self.study_session.participants.add(self.user)
        SessionUser.objects.create(user=self.user, session=self.study_session)
        
        data = {"roomCode": self.study_session.roomCode}
        response = self.client.post("/api/leave-room/", data, format="json")
        
        self.user.refresh_from_db()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.user.streaks, 7)  # Streak should remain unchanged

    def test_create_room_removes_from_existing(self):
        """Test user is removed from existing sessions when creating new one"""
        self.client.force_authenticate(user=self.user)
        # First create initial room
        self.client.post('/api/create-room/', {'sessionName': 'First Room'}, format='json')
        # Then create another room
        response = self.client.post(
            '/api/create-room/',
            {'sessionName': 'Second Room'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(SessionUser.objects.filter(user=self.user).count(), 1)

    def test_join_room_removes_user_from_existing_rooms(self):
        """Test that joining a room removes user from existing rooms"""
        room1 = StudySession.objects.create(
            roomCode="ROOM1",
            sessionName="Room 1",
            createdBy=self.user
        )

        
        # Create a new room to join
        room3 = StudySession.objects.create(
            roomCode="ROOM3",
            sessionName="Room 3",
            createdBy=self.other_user
        )

        
        response = self.client.post('/api/join-room/', {
            'roomCode': 'ROOM3'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # User should be removed from previous rooms
        self.assertEqual(SessionUser.objects.filter(user=self.user).count(), 1)
        self.assertFalse(SessionUser.objects.filter(user=self.user, session=room1).exists())
        self.assertTrue(SessionUser.objects.filter(user=self.user, session=room3).exists())


    def test_join_room_removes_from_existing(self):
        """Test user is removed from existing sessions when joining new one"""
        # Create second session

        other_session = StudySession.objects.create(
            createdBy=self.other_user,
            sessionName="Other Session"
        )
        other_session.participants.add(self.user)
        
        # Create a new room to join
        room3 = StudySession.objects.create(
            roomCode="ROOM3",
            sessionName="Room 3",
            createdBy=self.user_3
        )
        
        room3.participants.add(self.user)
        
        response = self.client.post('/api/join-room/', {
            'roomCode': 'ROOM3'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # User should be removed from previous rooms
        self.assertEqual(SessionUser.objects.filter(user=self.user).count(), 1)
        self.assertFalse(SessionUser.objects.filter(user=self.user, session=other_session).exists())
        self.assertTrue(SessionUser.objects.filter(user=self.user, session=room3).exists())




   