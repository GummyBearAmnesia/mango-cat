from django.test import TestCase
from django.utils import timezone
from api.models.events import Appointments
from api.utils import Calendar
from datetime import datetime, timedelta
from api.models import SpotifyToken
from api.utils import Spotify_API
import unittest
from unittest.mock import patch, MagicMock


class CalendarTest(TestCase):
    def setUp(self):
        """Set up test data"""
        # Create test events
        self.now = timezone.now()
        self.year = self.now.year
        self.month = self.now.month
        
        # Events for current month
        self.event1 = Appointments.objects.create(
            name="Team Meeting",  # Changed from 'name' to your actual field name
            start_date=self.now.replace(hour=10, minute=0),  # Changed from 'start_date'
            end_date=self.now.replace(hour=11, minute=0),  # Changed from 'end_date'
            comments="Test meeting"
        )
        
        # Event on same day as event1
        self.event2 = Appointments.objects.create(
            name="Lunch with Client",
            start_date=self.now.replace(hour=12, minute=0),
            end_date=self.now.replace(hour=13, minute=0),
            comments="Test meeting"
        )
        
        # Event on different day
        next_day = self.now + timedelta(days=1)
        self.event3 = Appointments.objects.create(
            name="Project Review",
            start_date=next_day.replace(hour=14, minute=0),
            end_date=next_day.replace(hour=15, minute=0),
            comments="Test meeting"
        )
        
        # Event in different month (shouldn't appear)
        next_month = self.now + timedelta(days=32)
        self.event4 = Appointments.objects.create(
            name="Future Event",
            start_date=next_month,
            end_date=next_month + timedelta(hours=1),
            comments="Test meeting"

        )

    def test_calendar_initialization(self):
        """Test calendar is initialized with correct year and month"""
        cal = Calendar(self.year, self.month)
        self.assertEqual(cal.year, self.year)
        self.assertEqual(cal.month, self.month)

    def test_formatday_no_events(self):
        """Test formatting a day with no events"""
        cal = Calendar(self.year, self.month)
        # Use a day that definitely has no events (like the 1st if our events are later)
        test_day = 1 if self.now.day > 1 else self.now.day + 2
        result = cal.formatday(test_day, Appointments.objects.none())
        
        self.assertIn(f'<span class=\'date\'>{test_day}</span>', result)
        self.assertIn('<ul>', result)
        self.assertNotIn('<li>', result)  # No events should mean no list items

    def test_formatday_with_events(self):
        """Test formatting a day with events"""
        cal = Calendar(self.year, self.month)
        day = self.now.day
        result = cal.formatday(day, Appointments.objects.all())
        
        self.assertIn(f'<span class=\'date\'>{day}</span>', result)
        self.assertIn('Team Meeting', result)
        self.assertIn('Lunch with Client', result)
        self.assertNotIn('Project Review', result)  # Should only show events for this day

    def test_formatday_zero_day(self):
        """Test formatting a zero day (empty calendar cell)"""
        cal = Calendar(self.year, self.month)
        result = cal.formatday(0, Appointments.objects.all())
        self.assertEqual(result, '<td></td>')

    def test_formatweek(self):
        """Test formatting a full week"""
        cal = Calendar(self.year, self.month)
        # Get the weeks for this month
        weeks = cal.monthdays2calendar(self.year, self.month)
        # Test the first week
        week = weeks[0]
        result = cal.formatweek(week, Appointments.objects.all())
        
        self.assertTrue(result.startswith('<tr>'))
        self.assertTrue(result.endswith('</tr>'))
        # Should have 7 days (some may be zero days)
        self.assertEqual(result.count('<td>'), 7)
        
        # Check if current day's events appear
        if self.now.day in [d for d, _ in week]:
            self.assertIn('Team Meeting', result)

    def test_month_header(self):
        """Test the month/year header is correctly formatted"""
        cal = Calendar(self.now.year, self.now.month)
        result = cal.formatmonth()
        
        month_name = self.now.strftime('%B')
        expected_header = f'{month_name} {self.now.year}'
        self.assertIn(expected_header, result)
        self.assertIn('<th colspan="7"', result)  # Header spans all columns

    def test_week_headers(self):
        """Test weekday headers are present"""
        cal = Calendar(self.now.year, self.now.month)
        result = cal.formatmonth()
        
        weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        for day in weekdays:
            self.assertIn(f'>{day}<', result)


    def test_empty_days(self):
        """Test days without events are rendered correctly"""
        cal = Calendar(self.now.year, self.now.month)
        result = cal.formatmonth()
        
        # Find a day that definitely has no events (like 1st if events are later)
        test_day = 1 if self.now.day > 1 else self.now.day + 2
        day_html = f'>{test_day}</span><ul>  </ul>'
        self.assertIn(day_html, result)

    def test_empty_month(self):
        """Test a month with no events"""
        # Find a month with no events (previous month)
        no_events_month = self.now.month - 1 if self.now.month > 1 else 12
        no_events_year = self.year if self.now.month > 1 else self.year - 1
        
        cal = Calendar(no_events_year, no_events_month)
        result = cal.formatmonth()
        
        # Should still render full calendar
        self.assertIn('<table', result)
        # Should not have any event content
        self.assertNotIn('<li>', result)

class SpotifyAPITestCase(unittest.TestCase):
    def setUp(self):
        self.api = Spotify_API()
        self.session_id = "test_session"
        self.mock_tokens = MagicMock()
        self.mock_tokens.access_token = "test_access_token"
        self.mock_tokens.refresh_token = "test_refresh_token"
        self.mock_tokens.token_type = "Bearer"
        self.mock_tokens.expires_in = timezone.now() + timedelta(seconds=3600)
        self.base_url = "https://api.spotify.com/v1/me/"
        self.endpoint = "test/endpoint"


    @patch('api.utils.post')
    @patch('api.utils.CLIENT_ID', 'test_client_id')
    @patch('api.utils.CLIENT_SECRET', 'test_client_secret')
    def test_refresh_spotify_token(self, mock_post):
    # Setup mock response
        mock_response = MagicMock()
        mock_response.json.return_value = {
        'access_token': 'new_token',
        'expires_in': 3600,
        'token_type': 'Bearer'
        }
        mock_post.return_value = mock_response

    # Setup mock tokens
        mock_tokens = MagicMock()
        mock_tokens.refresh_token = "refresh_token"
    
        with patch.object(self.api, 'get_user_tokens', return_value=mock_tokens):
        # Call the method
            self.api.refresh_spotify_token(self.session_id)
        
        # Assert post was called correctly
            mock_post.assert_called_once_with(
            'https://accounts.spotify.com/api/token',
            data={
                'grant_type': 'refresh_token',
                'refresh_token': 'refresh_token',
                'client_id': 'test_client_id',
                'client_secret': 'test_client_secret'
            }
            )

    @patch('api.utils.put')
    def test_play_song(self, mock_put):
        with patch.object(self.api, 'execute_spotify_api_request') as mock_execute:
            self.api.play_song(self.session_id)
            mock_execute.assert_called_with(
                self.session_id, "player/play", put_=True
            )

    @patch('api.utils.put')
    def test_pause_song(self, mock_put):
        with patch.object(self.api, 'execute_spotify_api_request') as mock_execute:
            self.api.pause_song(self.session_id)
            mock_execute.assert_called_with(
                self.session_id, "player/pause", put_=True
            )

    @patch('api.utils.post')
    def test_skip_song(self, mock_put):
        with patch.object(self.api, 'execute_spotify_api_request') as mock_execute:
            self.api.skip_song(self.session_id)
            mock_execute.assert_called_with(
                self.session_id, "player/next", post_=True
            )

    def test_get_user_tokens_exists(self):
        mock_queryset = MagicMock()
        mock_queryset.exists.return_value = True
        mock_queryset.__getitem__.return_value = self.mock_tokens
        
        with patch('api.models.SpotifyToken.objects.filter', return_value=mock_queryset):
            result = self.api.get_user_tokens(self.session_id)
            self.assertEqual(result, self.mock_tokens)
            SpotifyToken.objects.filter.assert_called_with(user=self.session_id)

    
    def test_get_user_tokens_not_exists(self):
        mock_queryset = MagicMock()
        mock_queryset.exists.return_value = False
        
        with patch('api.models.SpotifyToken.objects.filter', return_value=mock_queryset):
            result = self.api.get_user_tokens(self.session_id)
            self.assertIsNone(result)


    def test_update_or_create_user_tokens_update_existing(self):
        with patch.object(self.api, 'get_user_tokens', return_value=self.mock_tokens):
            self.api.update_or_create_user_tokens(
                self.session_id,
                "new_access_token",
                "Bearer",
                3600,
                "new_refresh_token"
            )
            self.assertEqual(self.mock_tokens.access_token, "new_access_token")
            self.assertEqual(self.mock_tokens.refresh_token, "new_refresh_token")
            self.assertEqual(self.mock_tokens.token_type, "Bearer")
            self.mock_tokens.save.assert_called()

    def test_is_spotify_authenticated_authenticated(self):
        with patch.object(self.api, 'get_user_tokens', return_value=self.mock_tokens):
            result = self.api.is_spotify_authenticated(self.session_id)
            self.assertTrue(result)

    def test_is_spotify_authenticated_expired(self):
        expired_tokens = MagicMock()
        expired_tokens.expires_in = timezone.now() - timedelta(seconds=10)
        
        with patch.object(self.api, 'get_user_tokens', return_value=expired_tokens), \
             patch.object(self.api, 'refresh_spotify_token') as mock_refresh:
            
            result = self.api.is_spotify_authenticated(self.session_id)
            self.assertTrue(result)
            mock_refresh.assert_called_with(self.session_id)

    def test_is_spotify_authenticated_not_authenticated(self):
        with patch.object(self.api, 'get_user_tokens', return_value=None):
            result = self.api.is_spotify_authenticated(self.session_id)
            self.assertFalse(result)

    
    def test_update_or_create_user_tokens_create_new(self):
        print(f"\n=== Testing with session_id: {self.session_id} ===")
    
        self.api.update_or_create_user_tokens(
        self.session_id,
        "new_access_token",
        "Bearer",
        3600,
        "new_refresh_token"
        )
    
    # Print all tokens for this session
        tokens = SpotifyToken.objects.filter(user=self.session_id)
        print(f"Tokens for session {self.session_id}: {list(tokens.values())}")
    
    # Or print specific fields
        for token in tokens:
            print(f"""
            Session ID: {token.user}
            Access Token: {token.access_token}
            Refresh Token: {token.refresh_token}
            Expires: {token.expires_in}
            """)

    @patch('api.utils.post')
    def test_post_line_coverage(self, mock_post):
        """ONLY tests the post() call line"""
        with patch.object(self.api, 'get_user_tokens', return_value=self.mock_tokens), \
            patch('api.utils.get') as mock_get:
            
            # Force the post line to execute
            self.api.execute_spotify_api_request(
                session_id=self.session_id,
                endpoint=self.endpoint,
                post_=True
            )
            
            # Verify ONLY the post call
            mock_post.assert_called_once_with(
                f"{self.base_url}{self.endpoint}",
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f"Bearer {self.mock_tokens.access_token}"
                }
            )
    
    @patch('api.utils.put')
    def test_put_line_coverage(self, mock_put):
        """ONLY tests the put() call line"""
        with patch.object(self.api, 'get_user_tokens', return_value=self.mock_tokens), \
            patch('api.utils.get') as mock_get:
            
            # Force the put line to execute
            self.api.execute_spotify_api_request(
                session_id=self.session_id,
                endpoint=self.endpoint,
                put_=True
            )
            
            # Verify ONLY the put call
            mock_put.assert_called_once_with(
                f"{self.base_url}{self.endpoint}",
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f"Bearer {self.mock_tokens.access_token}"
                }
            )

    @patch('api.utils.Spotify_API.get_user_tokens')
    @patch('api.utils.get')  # Ensure this path is also correct
    def test_execute_spotify_api_request_json_exception(self, mock_get, mock_get_user_tokens):
        # Setup the mock token
        mock_token = MagicMock()
        mock_token.access_token = "valid_access_token"
        mock_get_user_tokens.return_value = mock_token

        # Setup the mock response
        mock_response = MagicMock()
        mock_response.json.side_effect = Exception("Error parsing JSON")  # Correctly setup exception
        mock_get.return_value = mock_response

        # Initialize API and invoke the method
        api = Spotify_API()
        result = api.execute_spotify_api_request(self.session_id, "test/endpoint")

        # Check the result
        self.assertEqual(result, {'Error': 'Issue with request'})

    def test_update_existing_tokens_with_none_refresh_token(self):
        mock_tokens = MagicMock()
        mock_tokens.refresh_token = "existing_refresh_token"
        
        with patch.object(self.api, 'get_user_tokens', return_value=mock_tokens):
            # Explicitly pass None as refresh_token
            self.api.update_or_create_user_tokens(
                session_id=self.session_id,
                access_token="new_access_token",
                token_type="Bearer",
                expires_in=3600,
                refresh_token=None  # Explicit None
            )
            
            # Should still use the limited update_fields
            mock_tokens.save.assert_called_once_with(
                update_fields=['access_token', 'expires_in', 'token_type']
            )
