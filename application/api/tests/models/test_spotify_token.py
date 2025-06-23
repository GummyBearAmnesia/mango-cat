"""Unit tests for the SpotifyToken model."""
from django.test import TestCase
from django.utils import timezone
from api.models import SpotifyToken
from datetime import timedelta  # Correct import

class SpotifyTokenModelTests(TestCase):

    def test_create_spotify_token(self):
        """
        Test the creation of a SpotifyToken and its fields.
        """
        # Create an instance of SpotifyToken
        token = SpotifyToken.objects.create(
            user="testuser123",
            refresh_token="abcd1234efgh5678",
            access_token="ijkl9012mnop3456",
            expires_in=timezone.now() + timedelta(seconds=3600),  # Correct usage
            token_type="Bearer"
        )

        # Verify each field contains the correct data
        self.assertEqual(token.user, "testuser123")
        self.assertEqual(token.refresh_token, "abcd1234efgh5678")
        self.assertEqual(token.access_token, "ijkl9012mnop3456")
        self.assertEqual(token.token_type, "Bearer")

        # Check if the token expires roughly in one hour
        expected_expiry = timezone.now() + timedelta(seconds=3600)
        self.assertTrue((expected_expiry - token.expires_in).total_seconds() < 10)

    def test_token_expiry(self):
        """
        Test the expiry time of the access token.
        """
        token = SpotifyToken.objects.create(
            user="testuser123",
            refresh_token="abcd1234efgh5678",
            access_token="ijkl9012mnop3456",
            expires_in=timezone.now() + timedelta(seconds=-10),  # Set as already expired
            token_type="Bearer"
        )

        # Check if the token is indeed expired
        self.assertTrue(token.expires_in < timezone.now())

# Run the tests
if __name__ == '__main__':
    TestCase.main()
