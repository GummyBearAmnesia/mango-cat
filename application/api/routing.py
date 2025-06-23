"""
WebSocket URL routing configuration.

This file defines the WebSocket endpoints for real-time communication in the application. 
It maps specific URL patterns to consumer classes, which handle WebSocket connections 
for different functionalities such as chat rooms and to-do lists.

Each route includes a `room_code` parameter to identify the specific study room 
and ensures that users are connected to the correct WebSocket channel.

Django Channels uses these routes to manage WebSocket connections asynchronously.
"""

from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/room/(?P<room_code>\w+)/$", consumers.RoomConsumer.as_asgi()),
    re_path(r'ws/todolist/(?P<room_code>\w+)/$', consumers.RoomConsumer.as_asgi()),
]
