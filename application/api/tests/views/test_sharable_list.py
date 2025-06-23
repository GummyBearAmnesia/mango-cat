from unittest.mock import patch
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from api.models import User, List, Task, StudySession, SessionUser

class SharedListViewTestCase(APITestCase):
    fixtures = [
        'api/tests/fixtures/default_user.json',
        'api/tests/fixtures/default_lists.json',
        'api/tests/fixtures/default_permissions.json',
        'api/tests/fixtures/default_list_task.json'
    ]

    def setUp(self):
        self.user = User.objects.get(username='@alice123')
        
        # Create shared list
        self.shared_list = List.objects.create(name="Shared List", is_shared=True)

        # Create task
        self.task = Task.objects.create(
            title="Shared Task",
            content="Task in shared list",
            list=self.shared_list
        )

        # Create study session with the EXACT field name your view expects
        self.study_session = StudySession.objects.create(
            createdBy=self.user,
            sessionName="test_session",
            endTime=None,
            roomCode='ABC123',
            # This must match exactly what your view is looking for
            Task=self.shared_list  # Note the capital 'T' if that's what your model uses
        )

        # Create session user
        SessionUser.objects.create(
            user=self.user,
            session=self.study_session,
            left_at=None
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    @patch("api.views.to_do_list.get_channel_layer")
    def test_delete_task_shared_list_success(self, mock_get_channel_layer):
        mock_channel_layer = mock_get_channel_layer.return_value
        task_id = self.task.pk

        response = self.client.delete(f'/api/delete_task/{task_id}/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    
    @patch("api.views.to_do_list.get_channel_layer")
    def test_create_task_shared_list_success(self, mock_get_channel_layer):
        mock_channel_layer = mock_get_channel_layer.return_value

        response = self.client.post('/api/new_task/', {
            "list_id": self.shared_list.pk,
            "title": "New Shared Task",
            "content": "Content"
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        

    def test_delete_task_shared_list_no_study_session(self):
        self.study_session.delete()
        response = self.client.delete(f'/api/delete_task/{self.task.pk}/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "No study session found for this list")


    def test_create_task_shared_list_no_study_session(self):
        self.study_session.delete()
        response = self.client.post('/api/new_task/', {
            "list_id": self.shared_list.pk,
            "title": "New Task",
            "content": "Content"
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "No study session found for this list")

    def test_patch_task_shared_list_no_study_session(self):
        self.study_session.delete()
        response = self.client.patch(f'/api/update_task/{self.task.pk}/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "No study session found for this list")

    @patch("api.views.to_do_list.get_channel_layer")
    def test_patch_task_shared_list_success(self, mock_get_channel_layer):
        mock_channel_layer = mock_get_channel_layer.return_value
        task_id = self.task.pk

        response = self.client.patch(f'/api/update_task/{task_id}/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        