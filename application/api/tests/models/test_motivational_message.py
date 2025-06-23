from django.test import TestCase
from api.models.motivational_message import MotivationalMessage

class MotivationalMessageTestCase(TestCase):
    
    def setUp(self):
        """ Set up test data before each test. """
        self.message_text = "Keep pushing forward!"
        self.message = MotivationalMessage.objects.create(text=self.message_text)

    def test_message_creation(self):
        """ Test if a motivational message is created correctly. """
        message = MotivationalMessage.objects.get(text=self.message_text)
        self.assertEqual(message.text, self.message_text)

    def test_string_representation(self):
        """ Test the __str__ method of the model. """
        self.assertEqual(str(self.message), self.message_text)

    def test_unique_constraint(self):
        """ Test that duplicate messages cannot be created. """
        with self.assertRaises(Exception): 
            MotivationalMessage.objects.create(text=self.message_text)

    def test_message_count(self):
        """ Ensure only one message exists after duplicate insertion attempt. """
        self.assertEqual(MotivationalMessage.objects.count(), 1)
