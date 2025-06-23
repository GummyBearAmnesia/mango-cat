from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..models.rewards import Rewards

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_logged_in_user(request):
    '''Retrives the username and description of the currently logged in user,
    Required Authentication'''
    # get Authenticated User
    user = request.user  
    return Response({
        "username": user.username,
        "description": user.description,
    })


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def save_description(request):
    '''Update and save the description of the currently logged-in user.'''

    user = request.user
    # GET description or default 
    description = request.data.get('description')
    if description is None:
        description = ""

    # Update and save the user's description
    user.description = description
    user.save()
    return Response({
        "message": "Description updated successfully",
        "username": user.username,
        "description": user.description,
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_badges(request):
    '''Returns the list of badges that the user currently has earned'''
    user = request.user

    # Fetch all badges for the user
    badges = Rewards.objects.filter(user=user)

    # Format the data for response
    badge_list = [
        {
            "reward_number": badge.reward_number,
            "date_earned": badge.date_earned,
        }
        for badge in badges
    ]
    return Response(badge_list)