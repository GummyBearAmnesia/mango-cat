from api.models.user import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIRequestFactory
from api.models.events import Appointments
from datetime import datetime, timedelta
import json


class EventViewSetTests(APITestCase):
    def setUp(self):
        """Initialize test data and authenticate test client"""
        self.factory = APIRequestFactory()
        # Create test user with all required fields
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            firstname='Test',
            lastname='User',
            description='Test user'
        )
        self.current_time = datetime.now()
        # Create initial test appointment
        self.appointment = Appointments.objects.create(
            user=self.user,
            name='Doctor Appointment',
            start_date=self.current_time,
            end_date=self.current_time + timedelta(hours=1),
            comments='Annual checkup with Dr. Smith'
        )
        # Authenticate all test requests
        self.client.force_authenticate(user=self.user)

    def test_perform_create_integration(self):
        """Test creating appointment through API with field mappings (title->name, etc.)"""
        data = {
            'title': 'New Appointment',  # Using serializer field name
            'start': self.current_time.isoformat(),  # Serializer mapped field
            'end': (self.current_time + timedelta(hours=1)).isoformat(),
            'description': 'Test description'  # Maps to comments field
        }
        response = self.client.post('/api/events/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify data was saved correctly with proper user assignment
        appointment = Appointments.objects.latest('id')
        self.assertEqual(appointment.user, self.user)
        self.assertEqual(appointment.name, 'New Appointment')  # Check model field
        self.assertEqual(appointment.comments, 'Test description')

    def test_read_only_user_field(self):
        """Verify that user field is read-only and can't be overridden"""
        # Create second test user
        another_user = User.objects.create_user(
            firstname='another',
            lastname='useranother',
            username='anotheruser_unique',  # Must be unique
            email='another@example.com',
            password='testpass123',
            description='not known'
        )
        
        # Try to assign different user in request
        data = {
            'title': 'User Test',
            'start': self.current_time.isoformat(),
            'end': (self.current_time + timedelta(hours=1)).isoformat(),
            'user': another_user.id  # Should be ignored
        }
        
        response = self.client.post('/api/events/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify appointment was assigned to authenticated user, not the one in request
        appointment = Appointments.objects.latest('id')
        self.assertEqual(appointment.user, self.user)
        self.assertNotEqual(appointment.user, another_user)

    def test_appointment_creation(self):
        '''Verify initial test appointment was created correctly in setUp()'''
        self.assertEqual(Appointments.objects.count(), 1)  # Check only one exists
        appointment = Appointments.objects.first()
        # Verify all fields were saved correctly
        self.assertEqual(appointment.name, 'Doctor Appointment')
        self.assertEqual(appointment.comments, 'Annual checkup with Dr. Smith')
        self.assertEqual(appointment.user, self.user)
        # Compare as strings to avoid timezone issues
        self.assertEqual(
            appointment.start_date.strftime("%Y-%m-%d %H:%M:%S"),
            self.current_time.strftime("%Y-%m-%d %H:%M:%S")
        )
        self.assertEqual(
            appointment.end_date.strftime("%Y-%m-%d %H:%M:%S"),
            (self.current_time + timedelta(hours=1)).strftime("%Y-%m-%d %H:%M:%S")
        )

    def test_create_appointment_unauthenticated(self):
        """Verify authentication is required to create appointments"""
        self.client.logout()  # Remove authentication
        data = {
            "name": "Unauthorized Appointment",
            "start_date": self.current_time.isoformat(),
            "end_date": (self.current_time + timedelta(hours=1)).isoformat()
        }
        response = self.client.post("/api/events/", data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(Appointments.objects.count(), 1)  # No new appointment created

    def test_delete_appointment(self):
        """Test successful deletion of an appointment"""
        url = f"/api/events/{self.appointment.id}/"
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Appointments.objects.count(), 0)  # Verify deletion

    def test_create_appointment_invalid_data(self):
        """Test validation with invalid data (empty name)"""
        invalid_data = {
            "name": "",  # Empty name should fail validation
            "start_date": self.current_time.isoformat(),
            "end_date": (self.current_time + timedelta(hours=1)).isoformat()
        }
        response = self.client.post("/api/events/", invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)  # Should fail