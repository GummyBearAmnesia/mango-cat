"""Unit tests for the StudySession model."""
from django.test import TestCase
from api.models import StudySession, User
from datetime import datetime, time, date, timedelta
from django.utils.timezone import now
from django.core.exceptions import ValidationError

class StudySessionTestCase(TestCase):
    """Unit tests for the StudySession model."""

    def setUp(self):
        self.user = User.objects.create(firstname = "John", lastname = "Doe", email = "johndoe@example.com", username = "@johndoe")
        self.sessionName = "Test Session"
        self.startTime = now()
        self.endTime = self.startTime + timedelta(hours=2)
        self.date = date.today()
        self.session = StudySession.objects.create(createdBy = self.user, sessionName = self.sessionName, startTime = self.startTime, endTime = self.endTime)

    def test_study_session_creation(self):
        """ Testing if the instance of a study session is created correctly """
        self.assertEqual(StudySession.objects.count(), 1)
        self.assertEqual(self.session.createdBy.firstname , "John")
        self.assertEqual(self.session.sessionName, "Test Session")
        self.assertEqual(self.session.endTime, self.endTime)
        self._assert_session_is_valid()

    def test_study_session_str_method(self):
        """ Checking if the __str__ method returns expected string """
        expected_str = f"Study session {self.sessionName} was created by {self.user} on {self.date}. It was initiated at {self.startTime} and terminated at {self.endTime}"
        self.assertEqual(str(self.session), expected_str)


    def _assert_session_is_valid(self):
        try:
            self.session.full_clean()
        except (ValidationError):
            self.fail('Test session should be valid')

    def _assert_session_is_invalid(self):
        with self.assertRaises(ValidationError):
            self.session.full_clean()

