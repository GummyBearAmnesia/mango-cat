from importlib import import_module
from django.test import RequestFactory, TestCase
from unittest.mock import patch, MagicMock
from django.urls import reverse
from rest_framework import status
from django.contrib.sessions.middleware import SessionMiddleware
from api.views.spotify_view import *
from api.models import SpotifyToken
from django.utils import timezone
from datetime import timedelta
import json
from django.contrib.sessions.backends.db import SessionStore
from django.conf import settings
from django.contrib.sessions.models import Session
from rest_framework.test import APIRequestFactory, APIClient
from api.utils import Spotify_API

class AuthURLTests(TestCase):

    def test_auth_url(self):
        """
        Ensure that the AuthURL view returns a correct Spotify authorization URL.
        """
        url = reverse('get-auth-url')  # Assuming you have named your URL pattern as 'auth_url'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('url', response.data)
        self.assertTrue("https://accounts.spotify.com/authorize" in response.data['url'])

class SpotifyCallbackTests(TestCase):

    def setUp(self):
        self.factory = RequestFactory()
        self.callback_url = reverse('spotify-callback')  # Adjust as necessary

    @patch('requests.post')
    def test_spotify_callback(self, mock_post):
        # Mocking the Spotify API response
        mock_post.return_value.json.return_value = {
            'access_token': 'mocked_access_token',
            'token_type': 'Bearer',
            'refresh_token': 'mocked_refresh_token',
            'expires_in': 3600,  # seconds until the token expires
        }
        mock_post.return_value.status_code = 200

        request = self.factory.get(self.callback_url, {'code': 'dummycode'})
        add_session_to_request(request)  # Make sure your request has a session

        response = spotify_callback(request)
        self.assertEqual(response.status_code, 200)
        self.assertIn('window.close()', response.content.decode())

    @patch('requests.post')
    def test_spotify_callback_creates_session_when_none_exists(self, mock_post):
    # Mock successful Spotify response
        mock_response = MagicMock()
        mock_response.json.return_value = {
        'access_token': 'test_token',
        'token_type': 'Bearer',
        'refresh_token': 'test_refresh',
        'expires_in': 3600
        }
        mock_post.return_value = mock_response

    # Create request
        request = self.factory.get(self.callback_url, {'code': 'test_code'})
    
    # Manually add empty session (no session_key yet)
        middleware = SessionMiddleware(lambda req: HttpResponse())
        middleware.process_request(request)
        request.session = MagicMock()
        request.session.session_key = None
        request.session.exists.return_value = False
    
    # Verify initial state
        self.assertFalse(request.session.exists(request.session.session_key))

    # Call view - this should create the session
        response = spotify_callback(request)

    # Verify session was created/used
        request.session.create.assert_called_once()  # Verify create() was called
        self.assertEqual(response.status_code, 200)

def add_session_to_request(request):
    """Middleware to simulate session on request objects created via RequestFactory."""
    middleware = SessionMiddleware(lambda x: x)
    middleware.process_request(request)
    request.session.save()

class GetSpotifyTokenTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.url = reverse('get-token')
        
        # Create and save a session properly
        self.session = SessionStore()
        self.session.create()
        self.session_key = self.session.session_key
        self.session.save()
        
        # Create token with the real session key
        SpotifyToken.objects.create(
            user=self.session_key,
            refresh_token="abcd1234efgh5678",
            access_token="ijkl9012mnop3456",
            expires_in=timezone.now() + timedelta(seconds=3600),
            token_type="Bearer"
        )

    def add_session_to_request(self, request):
        """Helper to properly add session to request"""
        middleware = SessionMiddleware(lambda req: None)
        middleware.process_request(request)
        request.session.save()
        return request

    def test_token_retrieval(self):
        """Test retrieving a Spotify token from the session."""
        request = self.factory.get(self.url)
        request = self.add_session_to_request(request)
        request.session = self.session
        request.session.save()
        
        print("\nDebug Info:")
        print(f"Token in DB for user: {SpotifyToken.objects.first().user}")
        print(f"Request session key: {request.session.session_key}")
        
        response = GetSpotifyToken.as_view()(request)
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content.decode())
        self.assertEqual(response_data['access_token'], 'ijkl9012mnop3456')

    def test_no_token_available(self):
        """Test response when no token is available."""
        request = self.factory.get(self.url)
        
        # Add fresh session to request
        request = self.add_session_to_request(request)
        
        # Verify session exists but no token
        self.assertIsNotNone(request.session.session_key)
        self.assertFalse(SpotifyToken.objects.filter(user=request.session.session_key).exists())
        
        response = GetSpotifyToken.as_view()(request)
        self.assertEqual(response.status_code, 404)
        response_data = json.loads(response.content.decode())
        self.assertEqual(response_data['error'], 'No token available')

    def test_session_creation_when_none_exists(self):
   
        request = self.factory.get(self.url)
    
    # Add session middleware
        middleware = SessionMiddleware(lambda req: None)
        middleware.process_request(request)
    
    # Verify no session key initially
        self.assertIsNone(request.session.session_key)
    
    # Create a real session in the view (not mocking)
        response = GetSpotifyToken.as_view()(request)
    
    # Debug output
        print("\nSession creation test debug:")
        print(f"Session key after view: {request.session.session_key}")
        print(f"Session exists in DB: {Session.objects.filter(session_key=request.session.session_key).exists()}")
    
    # Verify session was created and saved
        self.assertIsNotNone(request.session.session_key,
                       "View should have created a session key")
        self.assertTrue(Session.objects.filter(session_key=request.session.session_key).exists(),
                  "Session should exist in database")
    
    # Verify response (should be 404 since we didn't create a token)
        self.assertEqual(response.status_code, 404)

class IsAuthenticatedTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.view = IsAuthenticated.as_view()
        self.url = '/api/is-authenticated/'
    
    # Create a request first to get a real session
        request = self.factory.get(self.url)
        engine = import_module(settings.SESSION_ENGINE)
        request.session = engine.SessionStore()
        request.session.create()  # This generates a real session key
        self.session_key = request.session.session_key
    
    # Create token with the REAL session key
        SpotifyToken.objects.create(
        user=self.session_key,  # Use the actual session key
        access_token='test_token',
        refresh_token='test_refresh',
        expires_in=timezone.now() + timedelta(hours=1),
        token_type='Bearer'
        )
        request.session.save()

    def test_authenticated_user(self):
        request = self.factory.get(self.url)
    
    # Use the same session we created in setUp
        engine = import_module(settings.SESSION_ENGINE)
        request.session = engine.SessionStore(self.session_key)
        request.session.save()
    
    # Debug output
        print(f"\nToken in DB for: {SpotifyToken.objects.first().user}")
        print(f"Request session key: {request.session.session_key}")
    
        response = self.view(request)
    
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['status'], 
                   msg=f"Expected True, got {response.data}. Token exists: {SpotifyToken.objects.filter(user=request.session.session_key).exists()}")
        

class SpotifyViewTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        
        # Create and save a session
        self.session = SessionStore()
        self.session.create()
        self.session_key = self.session.session_key
        self.session.save()
        
        # Create test token
        self.token = SpotifyToken.objects.create(
            user=self.session_key,
            access_token='valid_access_token',
            refresh_token='valid_refresh_token',
            expires_in=timezone.now() + timedelta(hours=1),
            token_type='Bearer'
        )
    
    def add_session_to_request(self, request):
        """Add session to request"""
        middleware = SessionMiddleware(lambda req: None)
        middleware.process_request(request)
        request.session = self.session
        request.session.save()
        return request
    
    def test_current_song_success(self):
    # Create mock
        mock_spotify = MagicMock(spec=Spotify_API)  # Use spec to ensure proper mocking
    
    # Configure mock response
        mock_response = {
        'item': {
            'name': 'Test Song',
            'duration_ms': 240000,
            'album': {'images': [{'url': 'http://test.com/image.jpg'}]},
            'artists': [{'name': 'Artist 1'}, {'name': 'Artist 2'}],
            'id': 'test123'
        },
        'progress_ms': 120000,
        'is_playing': True
        }
        mock_spotify.execute_spotify_api_request.return_value = mock_response
        mock_spotify.get_user_tokens.return_value = self.token
        mock_spotify.is_spotify_authenticated.return_value = True

    # Create request
        request = self.factory.get('/current-song/')
        request = self.add_session_to_request(request)

    # IMPORTANT: Patch the exact spot where Spotify_API is instantiated
        with patch.object(Spotify_API, '__new__', return_value=mock_spotify):
            response = CurrentSong.as_view()(request)
    
    # Debug output
        print("\n=== Mock Verification ===")
        print("Mock execute_spotify_api_request calls:", 
          mock_spotify.execute_spotify_api_request.call_args_list)
    
    # Verify
        mock_spotify.execute_spotify_api_request.assert_called_once_with(
        self.session_key,
        "player/currently-playing"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Test Song')

    @patch.object(Spotify_API, '__new__')
    def test_play_song_success(self, mock_spotify_new):
    # Create mock
        mock_spotify = MagicMock(spec=Spotify_API)
        mock_spotify_new.return_value = mock_spotify
    
    # Create request
        request = self.factory.put('/play-song/')
        request = self.add_session_to_request(request)
    
    # Call view
        response = PlaySong.as_view()(request)
    
    # Verify
        mock_spotify.play_song.assert_called_once_with(self.session_key)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    @patch.object(Spotify_API, '__new__')
    def test_pause_song_success(self, mock_spotify_new):
    # Create mock
        mock_spotify = MagicMock(spec=Spotify_API)
        mock_spotify_new.return_value = mock_spotify
    
    # Create request
        request = self.factory.put('/pause-song/')
        request = self.add_session_to_request(request)
    
    # Call view
        response = PauseSong.as_view()(request)
    
    # Verify
        mock_spotify.pause_song.assert_called_once_with(self.session_key)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    @patch.object(Spotify_API, '__new__')
    def test_skip_song_success(self, mock_spotify_new):
    # Create mock
        mock_spotify = MagicMock(spec=Spotify_API)
        mock_spotify_new.return_value = mock_spotify
    
    # Create request
        request = self.factory.post('/skip-song/')
        request = self.add_session_to_request(request)
    
    # Call view
        response = SkipSong.as_view()(request)
    
    # Verify
        mock_spotify.skip_song.assert_called_once_with(self.session_key)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_current_song_no_item(self):
    # Mock API response with error
        with patch.object(Spotify_API, 'execute_spotify_api_request', return_value={'error': 'invalid'}):
            request = self.factory.get('/current-song/')
            request = self.add_session_to_request(request)
            response = CurrentSong.as_view()(request)
            self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_pause_song_no_session(self):
        request = self.factory.put('/pause-song/')
        request.session = MagicMock(session_key=None)
    
    # Mock the view instance
        with patch.object(PauseSong, 'request', request, create=True):
            response = PauseSong().put(response=request)
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_play_song_no_session(self):
        request = self.factory.put('/play-song/')
        request.session = MagicMock(session_key=None)
    
    # Mock the view instance
        with patch.object(PlaySong, 'request', request, create=True):
            response = PlaySong().put(response=request)
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_skip_song_no_session(self):
        request = self.factory.post('/skip-song/')
        request.session = MagicMock(session_key=None)  # No session key
        response = SkipSong.as_view()(request)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)