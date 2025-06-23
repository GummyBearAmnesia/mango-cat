from channels.testing import WebsocketCommunicator
from django.utils import asyncio

from api.consumers import RoomConsumer
from api.models import StudySession, User
from channels.db import database_sync_to_async
from channels.routing import URLRouter
from django.urls import re_path
from datetime import datetime, time, timedelta
import json
from django.test import TestCase

"""
Tests for the websockets used in the chat in the group study room
"""

# Define a URL router for the WebSocket consumer
application = URLRouter([
    re_path(r"ws/room/(?P<room_code>\w+)/$", RoomConsumer.as_asgi()),
])


class ChatConsumerTests(TestCase):
    fixtures = [
        'api/tests/fixtures/default_user.json'
    ]

    def setUp(self):
        self.user = User.objects.get(username='@alice123')

        self.study_session = StudySession.objects.create(createdBy=self.user, sessionName="Test Room")



    async def test_chat_message(self):
        # Create a test StudySession and User
        study_session = await database_sync_to_async(StudySession.objects.create)(createdBy=self.user,
                                                                                  sessionName="Test Room")
        user = self.user

        # Connect to the WebSocket
        communicator = WebsocketCommunicator(application, f"ws/room/{study_session.roomCode}/")
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        # Receive the participants_update message
        participants_response = await communicator.receive_json_from()
        self.assertEqual(participants_response, {
            "type": "participants_update",
            "participants": [],  # Initially, no participants
        })

        # Send a chat message
        await communicator.send_json_to({
            "type": "chat_message",
            "message": "Hello, World!",
            "sender": "test_user",
        })

        # Receive the message
        response = await communicator.receive_json_from()
        self.assertEqual(response, {
            "type": "chat_message",
            "message": "Hello, World!",
            "sender": "test_user",
        })

        # Disconnect
        await communicator.disconnect()

    async def test_typing(self):
        # Create a test StudySession and User
        study_session = await database_sync_to_async(StudySession.objects.create)(createdBy=self.user,
                                                                                  sessionName="Test Room")
        user = self.user

        # Connect to the WebSocket
        communicator = WebsocketCommunicator(application, f"ws/room/{study_session.roomCode}/")
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        # Receive the participants_update message
        participants_response = await communicator.receive_json_from()
        self.assertEqual(participants_response, {
            "type": "participants_update",
            "participants": [],  # Initially, no participants
        })

        # Send a typing event
        await communicator.send_json_to({
            "type": "typing",
            "sender": "test_user",
        })

        # Receive the typing event
        response = await communicator.receive_json_from()
        self.assertEqual(response, {
            "type": "typing",
            "sender": "test_user",
        })

        # Disconnect
        await communicator.disconnect()
