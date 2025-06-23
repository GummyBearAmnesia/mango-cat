
from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes

# Main chat page - shows list of available rooms
def index(request):
    return render(request, 'chat/index.html', {})

# Individual chat room - takes room name as parameter
def room(request, room_name):
    return render(request, 'chat/room.html', {
        'room_name': room_name # Pass room name to template
    })