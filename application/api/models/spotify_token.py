from django.db import models

''' Model to store Spotify authentication tokens for users. 
This allows the application to fetch data from Spotify on behalf of the user without needing to re-authenticate each time.
It stores refresh and access tokens, along with their expiry times and type.'''
class SpotifyToken(models.Model):
    user = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    refresh_token = models.CharField(max_length=150)
    access_token = models.CharField(max_length=150)
    expires_in = models.DateTimeField()
    token_type = models.CharField(max_length=50)

