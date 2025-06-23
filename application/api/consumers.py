
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core.exceptions import ObjectDoesNotExist
from asgiref.sync import sync_to_async
from .models import StudySession
import json

class RoomConsumer(AsyncWebsocketConsumer):

    """
    WebSocket consumer for handling study room interactions.
    Manages chat, participant updates, and shared materials in real-time.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.room_group_name = None
        self.room_code = None
        self.study_session = None
        #self.username = None
        #self.list_id = None

    async def connect(self):
        """Handles a new WebSocket connection."""
        self.room_code = self.scope["url_route"]["kwargs"]["room_code"]
        print(f"Connecting to room: {self.room_code}")

        try:
            self.study_session = await sync_to_async(StudySession.objects.get)(roomCode=self.room_code)
        except ObjectDoesNotExist:
            await self.close()
            return

        self.room_group_name = f"room_{self.room_code}"

        # Add the user to the room's group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        # Broadcast updated participants list
        await self.update_participants()

    async def disconnect(self, close_code):
        """Handles WebSocket disconnection."""
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        await self.update_participants()

    @sync_to_async
    def get_participants(self):
        """Fetch the list of participants in the study room."""
        
        if not self.study_session:
            return []

        try:
            study_session = StudySession.objects.get(roomCode=self.room_code)
            participants = study_session.participants.all()
            return [participant.username for participant in participants]
        except StudySession.DoesNotExist:
            print(f"StudySession {self.room_code} not found.")
            return [] 

    async def receive(self, text_data):
        """Handles incoming WebSocket messages."""
        data = json.loads(text_data)
        message_type = data.get("type")

        # Handle chat messages sent by users
        if message_type == "chat_message":
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "message": data["message"],
                    "sender": data["sender"],
                }
            )
        
        # Handle request to update the list of participants
        elif message_type == "update_participants":
            await self.update_participants()
        
        # Handle study-related updates sent to the group
        elif message_type == "study_update":
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "study_update",
                    "update": data["update"],
                }
            )
        
        # Handle user typing indicator
        elif message_type == "typing":
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "typing",
                    "sender":data["sender"],
                }
            )

        # Handle file upload notification
        elif message_type == "file_uploaded":
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type" : "file_uploaded",
                    "file" : data["file"],
                }
            )
        
        # Handle file deletion notification
        elif message_type == "file_deleted":
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type" : "file_deleted",
                    "fileName" : data["fileName"],
                }
            )

    async def participants_update(self, event):
        await self.send(text_data=json.dumps({
            "type": "participants_update",
            "participants": event["participants"],
        }))

    async def chat_message(self, event):
        """Sends chat messages to clients."""
        await self.send(text_data=json.dumps({
            "type": "chat_message",
            "message": event["message"],
            "sender": event["sender"],
        }))

    async def study_update(self, event):
        """Sends study updates to clients."""
        await self.send(text_data=json.dumps({
            "type": "study_update",
            "update": event["update"],
        }))

    async def typing(self, event):
        """Notifies clients when a user is typing."""
        await self.send(text_data=json.dumps({
            "type": "typing",
            "sender" : event["sender"],
        }))

    async def add_task(self, event):
        """Notifies clients about a new task added to the to-do list."""
        await self.send(text_data=json.dumps({
            "type": "add_task",
            "task": event["task"],
        }))

    async def remove_task(self, event):
        """Notifies clients when a task is removed from the to-do list."""
        await self.send(text_data=json.dumps({
            "type": "remove_task",
            "task_id": event["task_id"],
        }))

    async def toggle_task(self, event):
        """Notifies clients when a task is marked as completed or incomplete."""
        await self.send(text_data=json.dumps({
            "type": "toggle_task",
            "task_id": event["task_id"],
            "is_completed": event["is_completed"],
        }))

    async def delete_list(self, event):
        """Notifies clients when an entire to-do list is deleted."""
        await self.send(text_data=json.dumps({
            "type": "delete_list",
            "list_id": event["list_id"],
        }))
        
    async def file_uploaded(self, event):
        """Notifies clients when a file is uploaded to the study room."""
        await self.send(text_data=json.dumps({
            "type": "file_uploaded",
            "file": event["file"],
        }))

    async def file_deleted(self, event):
        """Notifies clients when a file is deleted from the study room."""
        try:
            await self.send(text_data=json.dumps({
                "type": "file_deleted",
                "fileName": event["fileName"],
            }))
        except Exception as e:
            print(f"Error in file_deleted: {e}")

    async def update_participants(self):
        """
        Fetches the updated list of participants and broadcasts it to the room.
        This is triggered when a user joins or leaves.
        """
        participants = await self.get_participants()
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "participants_update",
                "participants": participants,
            }
        )