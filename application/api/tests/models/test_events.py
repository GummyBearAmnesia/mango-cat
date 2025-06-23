from django.test import TestCase
from api.models.user import User
from datetime import datetime, timedelta
from django.utils import timezone
from api.models.events import Appointments

class EventModelTest(TestCase):
    '''Test suite for the Appointments model functionality and validations'''
    
    def setUp(self):
        '''Initialize test data - runs before each test method'''
        # Create a test user
        self.user = User.objects.create(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            firstname='Test',
            lastname='User',
            description='Test user'
        )
        
        # Set current time and create sample appointment
        self.current_time = timezone.now()
        self.appointment = Appointments.objects.create(
            user=self.user,
            name='Doctor Appointment',
            comments='Annual checkup with Dr. Smith',
            start_date=self.current_time,
            end_date=self.current_time + timedelta(hours=1)
        )

    def test_appointment_creation(self):
        '''Verify basic appointment creation with all fields'''
        self.assertEqual(Appointments.objects.count(), 1)  # Check object was created
        
        # Get first appointment and verify all fields
        appointment = Appointments.objects.first()
        self.assertEqual(appointment.name, 'Doctor Appointment')
        self.assertEqual(appointment.comments, 'Annual checkup with Dr. Smith')
        self.assertEqual(appointment.user, self.user)
        
        # Verify datetime fields (compared as strings to avoid timezone issues)
        self.assertEqual(
            appointment.start_date.strftime("%Y-%m-%d %H:%M:%S"),
            self.current_time.strftime("%Y-%m-%d %H:%M:%S")
        )
        self.assertEqual(
            appointment.end_date.strftime("%Y-%m-%d %H:%M:%S"),
            (self.current_time + timedelta(hours=1)).strftime("%Y-%m-%d %H:%M:%S")
        )

    def test_optional_fields(self):
        '''Test that comments field can be null or blank'''
        # Create appointment with null comments
        appointment = Appointments.objects.create(
            user=self.user,
            name='Meeting',
            start_date=self.current_time,
            end_date=self.current_time + timedelta(hours=2),
            comments=None  # Explicitly set to None
        )
        self.assertIsNone(appointment.comments)
        
        # Update to empty string
        appointment.comments = ''
        appointment.save()
        self.assertEqual(appointment.comments, '')

    def test_string_representation(self):
        '''Test the __str__ method returns appointment name'''
        self.assertEqual(str(self.appointment), 'Doctor Appointment')

    def test_foreign_key_relationship(self):
        '''Test the relationship between User and Appointments'''
        # Verify foreign key points to correct user
        self.assertEqual(self.appointment.user.pk, self.user.pk)
        # Verify reverse relationship works
        self.assertEqual(self.user.appointments_set.first(), self.appointment)

    def test_field_max_lengths(self):
        '''Verify character field length constraints'''
        # Get max_length from model definition
        max_length_name = self.appointment._meta.get_field('name').max_length
        max_length_comments = self.appointment._meta.get_field('comments').max_length
        
        # Verify against expected values
        self.assertEqual(max_length_name, 200)
        self.assertEqual(max_length_comments, 500)

    def test_update_appointment(self):
        '''Test updating appointment fields'''
        # Modify all fields
        self.appointment.name = 'Updated Appointment'
        self.appointment.comments = 'Rescheduled appointment'
        new_end_time = timezone.now() + timedelta(hours=2)
        self.appointment.end_date = new_end_time
        self.appointment.save()

        # Retrieve updated appointment and verify changes
        updated_appointment = Appointments.objects.get(pk=self.appointment.pk)
        self.assertEqual(updated_appointment.name, 'Updated Appointment')
        self.assertEqual(updated_appointment.comments, 'Rescheduled appointment')
        self.assertEqual(
            updated_appointment.end_date.strftime("%Y-%m-%d %H:%M:%S"),
            new_end_time.strftime("%Y-%m-%d %H:%M:%S")
        )

    def test_delete_appointment(self):
        '''Test appointment deletion'''
        appointment_id = self.appointment.pk
        self.appointment.delete()
        
        # Verify appointment no longer exists
        with self.assertRaises(Appointments.DoesNotExist):
            Appointments.objects.get(pk=appointment_id)

    def test_appointment_with_minimal_fields(self):
        '''Test creation with only required fields (no comments)'''
        appointment = Appointments.objects.create(
            user=self.user,
            name='Minimal Appointment',
            start_date=self.current_time,
            end_date=self.current_time + timedelta(minutes=30)
        )
        # Comments should default to None when not provided
        self.assertEqual(appointment.comments, None)
        self.assertEqual(appointment.name, 'Minimal Appointment')

        # End before start
        invalid_appointment = Appointments.objects.create(
            user=self.user,
            name='Invalid Time',
            start_date=self.current_time,
            end_date=self.current_time - timedelta(hours=1)  # End before start
        )
        # Model should allow this (validation should be at serializer level)
        self.assertTrue(invalid_appointment.end_date < invalid_appointment.start_date)