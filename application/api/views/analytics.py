from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from rest_framework import status
from api.models import Rewards
from django.db import models

@api_view(['GET'])
@permission_classes([IsAuthenticated])

def get_analytics(request):
    '''Fetch and return user analytics including streaks, study hours, and earned badges.'''
    user = request.user

    # Calculate average study hours per session
    avg_study_hours = user.hours_studied / user.total_sessions if user.total_sessions > 0 else 0

    # Badge thresholds based on study hours
    badge_thresholds = {
        1: 1,    # Badge 1 for 1 hour
        2: 5,    # Badge 2 for 5 hours
        3: 15,   # Badge 3 for 15 hours
        4: 30,   # Badge 4 for 30 hours
        5: 50,   # Badge 5 for 50 hours
        6: 75,   # Badge 6 for 75 hours
        7: 100,  # Badge 7 for 100 hours
        8: 150,  # Badge 8 for 150 hours
    }

    # Track earned badges or create them if not already earned
    earned_badges = []
    for reward_number, threshold in badge_thresholds.items():
        if user.hours_studied >= threshold:
            reward, _ = Rewards.objects.get_or_create(
                user=user,
                reward_number=reward_number,
                
                # Set date_earned only if the badge is newly created
                defaults={"date_earned": timezone.now()}  
            )
            earned_badges.append({
                "reward_number": reward.reward_number,
                "date_earned": reward.date_earned.strftime("%Y-%m-%d")
            })
            
    # Return analytics data
    return Response({
        "streaks": user.streaks,
        "total_hours_studied": user.hours_studied,
        "is_sharable": user.share_analytics,
        "average_study_hours": round(avg_study_hours, 2),
        "earned_badges": earned_badges
    })

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_analytics(request):
    '''Toggle the user's share_analytics preference.'''
    user = request.user
    new_status = not user.share_analytics

    # Toggle share_analytics status
    user.share_analytics = new_status
    user.save()
    
    # Return success response
    return Response({"message": "Joined successfully!"}, status=status.HTTP_200_OK)

    