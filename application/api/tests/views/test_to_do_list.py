from rest_framework.test import APIClient
from django.test import RequestFactory
from rest_framework import status
from rest_framework.test import APITestCase
from api.models import User, List, Permission, Task
from api.views.to_do_list import ViewToDoList
from random import choice

"""
Tests for the ToDoList view class
"""

class ListViewTestCase(APITestCase):
    fixtures = ['api/tests/fixtures/default_user.json',
                'api/tests/fixtures/default_lists.json',
                'api/tests/fixtures/default_permissions.json', 
                'api/tests/fixtures/default_list_task.json']

    def setUp(self):
        """
        Set up data for testing using fixtures.
        """

        self.factory = RequestFactory()
        self.user = User.objects.get(username='@alice123')
        self.todo_list = List.objects.get(name='Default List1')

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_get_lists_for_user(self):
        """
        Test if the API correctly returns lists for an authenticated user based on permissions.
        """

        response = self.client.get('/api/todolists/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)

        list_data = response.data[0]
        self.assertEqual(list_data['id'], self.todo_list.id)
        self.assertEqual(list_data['name'], self.todo_list.name)
        self.assertEqual(list_data['is_shared'], self.todo_list.is_shared)


    def test_get_lists_for_groups(self):
        """
        Test if the API correctly returns lists for an authenticated user based on permissions.
        """

        response = self.client.get(f'/api/todolists/{self.todo_list.pk}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        list_data = response.data[0]
        self.assertEqual(list_data['id'], self.todo_list.id)
        self.assertEqual(list_data['name'], self.todo_list.name)
        self.assertEqual(list_data['is_shared'], self.todo_list.is_shared)


    def test_delete_task_success(self):
        """
        Test if the API correctly delete lists
        """
        list_to_delete = choice(Task.objects.all())
        id = list_to_delete.pk

        response = self.client.delete(f'/api/delete_task/{id}/')
        is_deleted = Task.objects.filter(pk=id).exists()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(is_deleted)

    def test_delete_task_not_found(self):
        """
        Make an invalid authenticated DELETE request using non-existing task id
        """
        response = self.client.delete(
            '/api/delete_task/9999/')  # Non-existent task
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "Task doesn't exist")

    def test_delete_task_exception(self):
        """
        Simulate an exception by sending an invalid task id
        """
        request = self.factory.delete(f'/delete_task/{self.todo_list.pk}/')

        request.resolver_match = type('', (), {"view_name": "delete_task"})()
        response = ViewToDoList().delete_task(request, "invalid_id")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Invalid request", response.data["error"])


    def test_delete_list_success(self):
        """ 
        Make an authenticated DELETE request to delete a list
        """
        list_to_delete = choice(List.objects.all())
        id = list_to_delete.pk
        response = self.client.delete(f'/api/delete_list/{id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(List.objects.filter(id=id).exists())
        self.assertFalse(Task.objects.filter(list=list_to_delete).exists())
        self.assertFalse(Permission.objects.filter(
            list_id=list_to_delete).exists())

    def test_delete_list_not_found(self):
        """ 
        Make an authenticated DELETE request using non-existent list id
        """
        response = self.client.delete(
            '/api/delete_list/9999/')  # Non-existent list
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "Task doesn't exist")

    def test_delete_list_exception(self):
        """Simulate an exception by sending an invalid list id"""
        request = self.factory.delete(f'/delete_list/{self.todo_list.pk}/')
        request.resolver_match = type('', (), {"view_name": "delete_list"})()
        response = ViewToDoList().delete_list(request, "invalid_id")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Invalid request", response.data["error"])


    def test_delete_invalid_action(self):
        """ 
        Make an authenticated DELETE request using invalid action
        """
        request = self.factory.delete('/api/invalid_action/')

        request.resolver_match = type('', (), {"view_name": "invalid_action"})()

        response = ViewToDoList().delete(request, 30)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "Invalid action")


    def test_patch_task_success(self):
        """
        Make an authenticated PATCH request to update status of the task
        """
        task = choice(Task.objects.all())
        id = task.pk
        response = self.client.patch(f'/api/update_task/{id}/')
        task.refresh_from_db()
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(task.is_completed, True)

    def test_patch_task_not_found(self):
        """
        Simulate an error by sending an incorrect task id
        """
        request = self.factory.patch(
        '/api/update_task/9999/')  # Non-existent task
    
        request.resolver_match = type(
        '', (), {"view_name": "update_task_status"})()

        response = ViewToDoList().patch(request, 9999)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {"error": "Task not found"})

    def test_patch_task_exception(self):
        """
        Simulate an exception by sending an invalid id
        """
        request = self.factory.patch(f'/patch_task/{self.todo_list.pk}/')
        request.resolver_match = type(
            '', (), {"view_name": "update_task_status"})()
        response = ViewToDoList().patch(request, "invalid_id")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Invalid request", response.data["error"])


    def test_post_create_new_task(self):
        """
        Make an authenticated POST request to create a new task
        """
        list_to_delete = choice(List.objects.all())
        id = list_to_delete.pk
        print(id)
        response = self.client.post('/api/new_task/', {
            "list_id": id,
            "title": "Task title",
            "content": "Task content"
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("title", response.data)

    def test_post_create_task_exception(self):
        """
        Simulate an exception by sending an incorrect data type
        """
        response = self.client.post('/api/new_task/', {
            "list_id": "invalid_id",  # Invalid list_id type
            "title": "Exception Task",
            "content": "This should trigger an exception"
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Invalid request", response.data["error"])

    def test_post_create_task_invalid_list(self):
        """ 
        Make an authenticated POST request using non-existent list id
        """
        response = self.client.post('/api/new_task/', {
            "list_id": 9999,  # Non-existent list ID
            "title": "Invalid Task",
            "content": "This task should fail"
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {"error": "List doesn't exist"})


    def test_post_create_new_list(self):
        """
        Make an authenticated POST request to create a new list
        """
        response = self.client.post(
            '/api/new_list/', {"name": "List", "is_shared": False}, format="json")

        self.assertNotEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_post_create_list_exception(self):
        """
        Simulate an exception by sending an incorrect data type for is_shared 
        """
        response = self.client.post('/api/new_list/', {"name": "List", "is_shared": "false"}, format = "json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Invalid request", response.data["error"])

    def test_post_invalid_action(self):
        """ 
        Make an authenticated POST request for an invalid action 
        """
        request = self.client.post('/api/invalid_action/', {})

        request.resolver_match = type(
            '', (), {"view_name": "invalid_action"})()
        response = ViewToDoList().post(request)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {"error": "Invalid action"})
