"""
Utilities for Calendar Rendering.

This file defines a custom `Calendar` class that extends Django's `HTMLCalendar` 
to generate an HTML calendar view with event data.

Key Features:
- Formats individual days (`formatday`) to include events.
- Formats weeks (`formatweek`) and months (`formatmonth`) into structured HTML tables.
- Retrieves events from the database, filtering them by year and month.
- Generates a visually structured calendar with event listings.

This utility is useful for dynamically displaying event schedules in a calendar format.
"""

from calendar import HTMLCalendar
from datetime import timedelta
from urllib import request
from .models.events import Appointments
from .models.spotify_token import SpotifyToken
from django.utils import timezone
from api.credentials import CLIENT_ID, CLIENT_SECRET
from requests import post, get, put

BASE_URL = "https://api.spotify.com/v1/me/"

class Calendar(HTMLCalendar):
	def __init__(self, year=None, month=None):
		self.year = year
		self.month = month
		super(Calendar, self).__init__()

	def formatday(self, day, events):
		events_per_day = events.filter(start_date__day=day)
		d = ''
		for event in events_per_day:
			d += f'<li> {event.name} </li>'

		if day != 0:
			return f"<td><span class='date'>{day}</span><ul> {d} </ul></td>"
		return '<td></td>'

	def formatweek(self, theweek, events):
		week = ''
		for d, weekday in theweek:
			week += self.formatday(d, events)
		return f'<tr> {week} </tr>'

	def formatmonth(self, withyear=True):
		events = Appointments.objects.filter(start_date__year=self.year, start_date__month=self.month)

		cal = f'<table border="0" cellpadding="0" cellspacing="0" class="calendar">\n'
		cal += f'{self.formatmonthname(self.year, self.month, withyear=withyear)}\n'
		cal += f'{self.formatweekheader()}\n'
		for week in self.monthdays2calendar(self.year, self.month):
			cal += f'{self.formatweek(week, events)}\n'
		return cal
	
# functions to retrieve data from spotify
class Spotify_API():
	# getting user tokens from session id 
	def get_user_tokens(self, session_id):
		user_tokens = SpotifyToken.objects.filter(user=session_id)
		if user_tokens.exists():
			return user_tokens[0]
		else:
			print("No token found for session_id:", session_id)
			return None
		
	# updating the token or craeting a new token if not found for a session id
	def update_or_create_user_tokens(self, session_id, access_token, token_type, expires_in, refresh_token=None):
		if access_token is None:
			print("Access token is missing, cannot update or create token.")
			return
		tokens = self.get_user_tokens(session_id)
		expires_in = timezone.now() + timedelta(seconds=expires_in)
		if tokens:
			tokens.access_token = access_token
			tokens.expires_in = expires_in
			tokens.token_type = token_type
			
			if refresh_token is not None:
				tokens.refresh_token = refresh_token
				tokens.save(update_fields=['access_token', 'refresh_token', 'expires_in', 'token_type'])
			else:
				tokens.save(update_fields=['access_token', 'expires_in', 'token_type'])
		else:
			print(f"Creating new tokens for session_id={session_id}")
			tokens = SpotifyToken(
            user=session_id,
            access_token=access_token,
            refresh_token=refresh_token if refresh_token else "",
            token_type=token_type,
            expires_in=expires_in
        	)
			tokens.save()

	# checking spotify authentication via tokens 
	def is_spotify_authenticated(self, session_id):
		tokens = self.get_user_tokens(session_id)
		if tokens:
			expiry = tokens.expires_in
			if expiry <= timezone.now():
				self.refresh_spotify_token(session_id)
			return True

		return False
	
	# getting a refresh token 
	def refresh_spotify_token(self, session_id):
		refresh_token = self.get_user_tokens(session_id).refresh_token
		response = post('https://accounts.spotify.com/api/token', data = {
			'grant_type': 'refresh_token',
			'refresh_token': refresh_token,
			'client_id': CLIENT_ID,
			'client_secret': CLIENT_SECRET,
		}).json()

		access_token = response.get('access_token')
		token_type = response.get('token_type')
		expires_in = response.get('expires_in')
		self.update_or_create_user_tokens(session_id, access_token, token_type, expires_in, refresh_token)
		
	# executing an api request to either, play, pause or skip songs 
	def execute_spotify_api_request(self, session_id, endpoint, post_=False, put_=False):
		tokens = self.get_user_tokens(session_id)
		headers = {'Content-Type': 'application/json',
               'Authorization': "Bearer " + tokens.access_token}
		if post_:
			post(BASE_URL + endpoint, headers=headers)
		if put_:
			put(BASE_URL + endpoint, headers=headers)
			
		response = get(BASE_URL + endpoint, {}, headers=headers)

		try:
			json_response = response.json()
			print("JSON Response:", json_response)
			return response.json()
		except:
			return {'Error': 'Issue with request'}
		
	def play_song(self, session_id):
		return self.execute_spotify_api_request(session_id, "player/play", put_=True)
	
	def pause_song(self, session_id):
		return self.execute_spotify_api_request(session_id, "player/pause", put_=True)
	
	def skip_song(self, session_id):
		return self.execute_spotify_api_request(session_id, "player/next", post_=True)




	
