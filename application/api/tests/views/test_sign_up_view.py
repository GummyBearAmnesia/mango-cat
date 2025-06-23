from rest_framework.test import APITestCase
from rest_framework import status
from api.models import User

"""
Tests for the Signup view class
"""

class SignupTestCase(APITestCase):

    def test_signup_success(self):
        """
        Test if the signup is successful when data is correct.
        """
        data = {
            'firstname': 'John',
            'lastname': 'Doe',
            'username': '@johndoe',
            'email': 'johndoe@example.com',
            'description': '',
            'password': 'password123',
            'passwordConfirmation': 'password123'
        }
        response = self.client.post('/api/signup/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['message'],
                         'User registered successfully!')

        user = User.objects.get(username='@johndoe')
        self.assertEqual(user.email, 'johndoe@example.com')


    def test_signup_username_taken(self):
        """
        Test if signup fails when the username is already taken.
        """
        User.objects.create_user(
            firstname='Jane', lastname='Doe', username='@johndoe', email='janedoe@example.com', description = '', password='password123'
        )

        data = {
            'firstname': 'John',
            'lastname': 'Doe',
            'username': '@johndoe',
            'email': 'johndoe@example.com',
            'description': '',
            'password': 'password123',
            'passwordConfirmation': 'password123'
        }
        response = self.client.post('/api/signup/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Username or email already exists')

    def test_signup_email_taken(self):
        """
        Test if signup fails when the email is already taken.
        """
        User.objects.create_user(
            firstname='Jane', lastname='Doe', username='@janedoe', email='johndoe@example.com', description='', password='password123'
        )

        data = {
            'firstname': 'John',
            'lastname': 'Doe',
            'username': '@johndoe',
            'email': 'johndoe@example.com',
            'description': '',
            'password': 'password123',
            'passwordConfirmation': 'password123'
        }
        response = self.client.post('/api/signup/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Username or email already exists')

    def test_signup_invalid_data(self):
        """
        Test if signup fails when the data is invalid (missing required fields).
        """
        data = {
            'firstname': 'John',
            'lastname': 'Doe',
            'username': '',
            'email': 'johndoe@example.com',
            'description': '',
            'password': 'password123',
            'passwordConfirmation': 'password123'
        }
        response = self.client.post('/api/signup/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('details', response.data)
    
    def test_invalid_email_format(self):
        """
        Test invalid email format raises a ValidationError
        """
        
        # Send a POST request with an invalid email format
        invalid_email_data = {
            "firstname": "John",
            "lastname": "Doe",
            "username": "johndoe123",
            "email": "invalid-email",  
            "description": "Test description",
            "password": "password123",
            "passwordConfirmation": "password123"
        }
        
        response = self.client.post('/api/signup/', invalid_email_data, format='json')
        
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Check if the error message contains the validation error for email format
        self.assertIn("email", response.data["error"])  
        self.assertTrue("Enter a valid email address" in response.data["error"]["email"][0])  

