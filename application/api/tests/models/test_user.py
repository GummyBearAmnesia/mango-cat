from django.db import IntegrityError
from django.test import TestCase
from django.contrib.auth import get_user_model
from api.models import User
from django.utils.timezone import now, timedelta

"""
Tests for the User model
"""

class UserModelTest(TestCase):

    def setUp(self):
        """
        Set up test data
        """
        self.user_data =    {
            "email": "testuser@email.com",
            "description": "",
            "firstname": "Test",
            "lastname": "User",
            "username": "TestUser1",
            "password": "Password123"
        }
    
    def test_user_creation(self):
        """
        Test creating a user with valid details
        """
        User = get_user_model()
        user = User.objects.create_user(**self.user_data)

        self.assertEqual(user.email, self.user_data['email'])
        self.assertEqual(user.firstname, self.user_data['firstname'])
        self.assertEqual(user.lastname, self.user_data['lastname'])
        self.assertEqual(user.username, self.user_data['username'])
        self.assertTrue(user.check_password(self.user_data['password']))
    
    def test_email_normlalisation(self):
        """
        Test that email is normalized -- lowercased domain part
        """
        User = get_user_model()
        email = 'Test@EXAMPLE.com'
        user = User.objects.create_user(description = "", email=email, firstname="Test", lastname="User", username="testuser", password="Password123!")
        self.assertEqual(user.email, "Test@example.com")

    def test_study_streak_increment(self):
        """
        Test that the study streak increments when studying on consecutive days
        """
        User = get_user_model()
        user = User.objects.create_user(**self.user_data)

        user.last_study_date = now().date() - timedelta(days=1)  # Yesterday
        user.streaks = 3
        user.save()
        
        user.update_study_streak()
        self.assertEqual(user.streaks, 4)

    def test_study_streak_reset(self):
        """
        Test that the study streak resets if a day is skipped
        """
        User = get_user_model()
        user = User.objects.create_user(**self.user_data)
        
        user.last_study_date = now().date() - timedelta(days=2)  # Two days ago
        user.streaks = 5
        user.save()
        
        user.update_study_streak()
        self.assertEqual(user.streaks, 1)

    def test_study_streak_same_day(self):
        """
        Test that the study streak remains the same if studying multiple times on the same day
        """
        User = get_user_model()
        user = User.objects.create_user(**self.user_data)

        user.last_study_date = now().date()
        user.streaks = 3
        user.save()
        
        user.update_study_streak()
        self.assertEqual(user.streaks, 3)

    def test_user_without_email_error(self):
        """
        Test that creating a user without an email raises an error
        """
        User = get_user_model()
        with self.assertRaises(ValueError):
            User.objects.create_user(description = "", email="", firstname="Test", lastname="User", username="testUser", password="password123")
        
    def test_user_without_username_error(self):
        """
        Test that creating a user without a username raises an error
        """
        User = get_user_model()
        with self.assertRaises(ValueError):
            User.objects.create_user(description = "", email="test@example.com", firstname="Test", lastname="User", username="", password="password123")

    def test_user_without_firstname_error(self):
        """
        Test that creating a user without a username raises an error
        """
        User = get_user_model()
        with self.assertRaises(ValueError):
            User.objects.create_user(description="", email="test@example.com",
                                     firstname="", lastname="User", username="Test", password="password123")

    def test_user_without_lastname_error(self):
        """
        Test that creating a user without a username raises an error
        """
        User = get_user_model()
        with self.assertRaises(ValueError):
            User.objects.create_user(description="", email="test@example.com",
                                     firstname="FirstName", lastname="", username="Test", password="password123")

    def test_user_without_password_error(self):
        """
        Test that creating a user without a password raises an error
        """
        User = get_user_model()
        with self.assertRaises(ValueError):
            User.objects.create_user(description = "", email="test@example.com", firstname="Test", lastname="User", username="testUser", password="")

    def test_user_with_none_description_fails(self):
        """
        Test that creating a user with None description fails when null=False
        """
        User = get_user_model()
        with self.assertRaises(IntegrityError):
            User.objects.create_user(description=None, email="test_none@example.com", firstname="Test", lastname="User", username="testUserNone", password="password123")

    def test_user_with_none_description_fails(self):
        """
        Test that creating a user with None description fails when null=False
        """
        user = User.objects.create_user(**self.user_data)
        full_name = user.full_name()
        self.assertEqual(full_name, "Test User")


    