from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from ..models import SessionUser, User, Task
from ..models.study_session import StudySession
from .to_do_list import ViewToDoList
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from unittest.mock import patch

'''
    API to manage group study rooms, it processes such as: creation, joining and notifications
'''

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_room(request):
    '''
    Creates a new study room. Required Authentication.
    '''
    user = request.user

    # Ensure authentication of user
    if not user.is_authenticated:
        return Response({"error": "User must be logged in"}, status=401)

    # GET session name or creates a default value
    session_name = request.data.get('sessionName', "Untitled Study Session - maybe something went wrong?")
    if session_name == "":
        session_name = "We couldn't think of anything :)"

    # Ensures the user is not already in a session, if so removes them 
    if SessionUser.objects.filter(user=user).exists():
        
        # Remove users from existing sessions
        session_users = SessionUser.objects.filter(user=user)
        for session_user in session_users:
            previous_session = session_user.session
            user = session_user.user
            previous_session.participants.remove(user)
            session_user.delete()
                
    try:
         
        # Creates a new study session
        room = StudySession.objects.create(createdBy = user,sessionName = session_name)
        room.participants.add(user)
        room.save()

        # Create or update a SessionUser Instance
        if SessionUser.objects.filter(user=user, session=room).exists():
            session_user = SessionUser.objects.filter(user=user, session=room).first()
            session_user.rejoin_session(user, room)
        else:
            session_user = SessionUser.objects.create(
                user=user,
                session=room,
            )
        # Update user's streak after creating a room
        user.update_study_streak()

        return Response({"roomCode" : room.roomCode,"roomList": room.Task.id})
    except Exception as e:
        return Response({"error": f"Failed to create room: {str(e)}"}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_room(request):
    '''
    Allows Users to join an existing study session. Required Authentication.
    '''
    user = request.user

    # Ensures user is authenticated
    if not user.is_authenticated:
        return Response({"error": "User must be logged in"}, status=401)

    # Removes the user from all existing rooms
    if SessionUser.objects.filter(user=user).exists():
        session_users = SessionUser.objects.filter(user=user)
        for session_user in session_users:
            previous_session = session_user.session
            user = session_user.user
            previous_session.participants.remove(user)
            session_user.delete()
            print(" user removed from old session")

    room_code = request.data.get('roomCode')
    if StudySession.objects.filter(roomCode=room_code).exists():
        study_session = StudySession.objects.get(roomCode=room_code)
        study_session.participants.add(user)
        study_session.save()

        # Notify all participants of the new join
        participants = study_session.participants.all()
        notify_participants(room_code, participants)

        # Create or Update the Instance of SessionUser
        if SessionUser.objects.filter(user=user, session=study_session).exists():
            session_user = SessionUser.objects.filter(
                user=user, session=study_session).first()
            session_user.rejoin_session(user, study_session)
        else:
            session_user = SessionUser.objects.create(
                user=user,
                session=study_session,
            )
        
        # Update user's streak after creating a room
        user.update_study_streak()
        
        return Response({"message": "Joined successfully!"})
    return Response({"error": "Room not found"}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_room_details(request):
    '''
    Retrieve details of a study session room, e.g. name and to-do list ID.
    '''
    room_code = request.query_params.get('roomCode')

    try:
        study_session = StudySession.objects.get(roomCode=room_code)
        session_name = study_session.sessionName
        return Response({"sessionName" : session_name,
                         "roomList": study_session.Task.id
        })
    except Exception as e:
        return Response({"error": f"Failed to retrieve room details: {str(e)}"}, status=400)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_room(request):
    '''
    Leave a study session room. Required Authentication.
    '''
    user = request.user

    # Ensures Authentication of User
    if not user.is_authenticated:
        return Response({"error": "User must be logged in"}, status=401)

    room_code = request.data.get('roomCode')
    if StudySession.objects.filter(roomCode=room_code).exists():
        study_session = StudySession.objects.get(roomCode=room_code)
        study_session.participants.remove(user)
        study_session.save()

        # Fetch Updated participants list
        participants = study_session.participants.all()

        # Notify all participants in the room of user leaving
        notify_participants(room_code, participants)

        try:
            session_user = SessionUser.objects.get(user=user, session=study_session)
            session_user.leave_session()

            # Destroy room if no particpants remain inside
            if (study_session.participants.count() == 0):
                destroy_room(request, study_session)

            user1 = session_user.user
            return Response({"message": "Left successfully!", "username": user.username})
        except SessionUser.DoesNotExist:
            return Response({"error": "User is not in the session"}, status=404)
    return Response({"error": "Room not found"}, status=404)

def notify_participants(room_code, participants):
    '''
    Update the participants in real time as someone joins the room, and leaves the room
    '''
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"room_{room_code}",
        {
            'type': 'participants_update',
            'participants': [participant.username for participant in participants],
        }
    )



def destroy_room(request, study_session):
    '''
    Destroy study session room and it's to-do-list if no participants remain
    '''
    toDo = ViewToDoList()

    # Delete the to-do-list within the room
    Task = study_session.Task.pk
    if hasattr(study_session, 'Task') and study_session.Task:
    # if Task:
        toDo.delete_list(request = request, list_id = Task)
    
    # Delete the Study Session 
    study_session.delete()




    


