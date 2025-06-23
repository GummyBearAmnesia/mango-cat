from rest_framework import viewsets, permissions
from api.models.events import Appointments
from api.serializers import AppointmentSerializer

class EventViewSet(viewsets.ModelViewSet):
    '''
    Manages user-specific appointments, required Authentication.
    '''
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Retrieve appointments for the currently authenticated user.
        return Appointments.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Associated the created appointment to an authenticated user.
        serializer.save(user=self.request.user)