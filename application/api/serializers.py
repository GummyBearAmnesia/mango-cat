"""
Serializer for Appointments.

This file defines the `AppointmentSerializer`, which transforms `Appointments` model 
instances into JSON representations and vice versa. It ensures that data is correctly 
structured when received from or sent to the API.

Key Features:
- Maps model fields to API-friendly names (`name` → `title`, `start_date` → `start`, etc.).
- Includes optional fields (e.g., `description` from `comments`).
- Prevents clients from modifying certain fields (`user` is read-only).
- Ensures proper validation and serialization for API responses.

This serializer helps maintain a clean and structured API interface for appointment-related data.
"""

from rest_framework import serializers
from api.models.events import Appointments


class AppointmentSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source='name') 
    start = serializers.DateTimeField(source='start_date') 
    end = serializers.DateTimeField(source='end_date')  
    description = serializers.CharField(source='comments', required=False) 

    class Meta:
        model = Appointments
        fields = ['id', 'title', 'description', 'start', 'end', 'user']
        extra_kwargs = {
            'user': {'read_only': True}, 
        }

    