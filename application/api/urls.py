from django.urls import path,include
from .views.login_page import login
from rest_framework.routers import DefaultRouter
#from .views.calendar import list_events
from .views.calendar import EventViewSet
from .views.spotify_view import AuthURL, spotify_callback, IsAuthenticated, GetSpotifyToken, CurrentSong, PauseSong, PlaySong, SkipSong

# Initialize DefaultRouter for REST framework endpoints
router = DefaultRouter()
# Register EventViewSet with 'events' endpoint
router.register(r'events', EventViewSet, basename='event')

# Define all URL patterns for the application
urlpatterns = [
    # REST framework router URLs
    path('', include(router.urls)),
     # Spotify authentication endpoints
    path('get-auth-url', AuthURL.as_view(), name='get-auth-url'),
    path('is-authenticated', IsAuthenticated.as_view(), name='is-authenticated'),
    path('spotify/callback/', spotify_callback, name="spotify-callback"),
    path('token/', GetSpotifyToken.as_view(), name='get-token'),
    # Spotify player control endpoints
    path('current-playing', CurrentSong.as_view(), name='current-playing'),
    path('pause', PauseSong.as_view()),
    path('play', PlaySong.as_view()),
    path('skip', SkipSong.as_view()),
    
]