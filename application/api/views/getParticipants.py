from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from ..models import SessionUser
from ..models.study_session import StudySession

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_participants(request):
    '''
    Retrieve all participants in the study room session based on the room code,
    Requires Authentication
    '''

    # Debugging: Log request details
    print("API is being called")
    print("Request headers:", request.headers)
    print("Request query params:", request.query_params)

    # Extract room code from the query parameters
    room_code = request.query_params.get('roomCode')

    print("Retrieving participants for the study room", room_code)

    try:
        # GET all study sessions using the room code
        study_session = StudySession.objects.get(roomCode=room_code)
        
        # GET all participants in the study sessions
        participants = study_session.participants.all()
        
        # Format the participant data
        participants_list = [{
            'username': participant.username,
        } for participant in participants]

        # Return the lists of participants
        return Response({"participantsList" : participants_list})
        
    except Exception as e:
        # Handles the errors and returns a response
        return Response({"error": f"Failed to retrieve participants: {str(e)}"}, status=400)