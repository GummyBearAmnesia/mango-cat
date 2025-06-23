from django.test import TestCase
from django.urls import reverse
from api.models.user import User
from api.models.rewards import Rewards
from rest_framework.test import APIClient, APITestCase
from rest_framework import status

"""
Tests for the Profile view functions
"""

class ProfileViewTestCase(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(firstname='test', lastname='user', email='test@123.com', description='hello', username='testuser', password='testpassword')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)


    def test_logged_in_user_retrieved(self):
        ''' Test retrieving the logged-in user's username and description '''
        response = self.client.get('/api/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], self.user.username)
        self.assertEqual(response.data['description'], self.user.description)


    def test_new_description_saved(self):
        ''' Test updating the user's description in the database '''
        new_desc = 'hello123'
        response = self.client.put('/api/description/', {'description': new_desc})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['description'], new_desc)

        # Verify that is was updated
        self.user.refresh_from_db()
        self.assertEqual(self.user.description, new_desc)

    def test_null_description_saved(self):
        ''' Test updating the user's description in the database '''
        new_desc = None
        response = self.client.put(
            '/api/description/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['description'], "")

        self.user.refresh_from_db()
        self.assertEqual(self.user.description, "")


    def test_get_user_badges(self):
        ''' Test the user's badges are correctly returned '''

        Rewards.objects.create(user=self.user, reward_number=1)
        Rewards.objects.create(user=self.user, reward_number=2)

        response = self.client.get('/api/badges/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['reward_number'], 1)
        self.assertEqual(response.data[1]['reward_number'], 2)