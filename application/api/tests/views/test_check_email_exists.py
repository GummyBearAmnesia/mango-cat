'''These tests were written by AI'''
from django.test import TestCase
from rest_framework.test import APIClient
from django.urls import reverse
from api.models.user import User

"""
Tests for the check email view, which is used in the sign up form validation to ensure
the email entered by the user doesn't already exist in the database
"""

class CheckEmailViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.test_email = "test@example.com"
        self.user = User.objects.create_user(firstname="test", lastname="user", description=" ", username="@testuser", email=self.test_email, password="password123")
        self.url = reverse("check_email")  

    def test_email_exists(self):
        """
        Test if function returns true if input email already exists
        """
        response = self.client.get(self.url, {"email": self.test_email})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"exists": True})

    def test_email_does_not_exist(self):
        """
        Test if function returns false if input email doesn't exist in the database
        """
        response = self.client.get(self.url, {"email": "nonexistent@example.com"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"exists": False})

    def test_missing_email_param(self):
        """
        Test if function returns false if no email entered
        """
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"exists": False})
