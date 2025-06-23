'''These tests were written by AI'''
from django.test import TestCase
from rest_framework.test import APIClient
from django.urls import reverse
from api.models.user import User

"""
Tests for the check username view, which is used in the sign up form validation to ensure
the username entered by the user doesn't already exist in the database
"""

class CheckUsernameViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.test_username = "@testuser"
        self.user = User.objects.create_user(firstname="test", lastname="user", description=" ", username=self.test_username, email="test@example.com", password="password123")
        self.url = reverse("check_username")  

    def test_username_exists(self):
        """
        Test if function returns true if input username already exists
        """
        response = self.client.get(self.url, {"username": self.test_username})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"exists": True})

    def test_username_does_not_exist(self):
        """
        Test if function returns false if input username doesn't exist in the database
        """
        response = self.client.get(self.url, {"username": "@nonexistant"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"exists": False})

    def test_missing_username_param(self):
        """
        Test if function returns false if no username entered
        """
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"exists": False})
