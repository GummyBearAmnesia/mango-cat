from django.http import JsonResponse
from api.models.user import User
from rest_framework.decorators import api_view

@api_view(['GET'])
def checkEmailView(request):
    '''
    Checks if an email exists in the database,
    Returns a boolean value using JSON Response, showcasing existance.
    '''

    # Gets email from query parameters 
    email = request.query_params.get("email")

    # Checks if email exists in the User Model
    if email and User.objects.filter(email=email).exists():
        return JsonResponse({"exists": True}, status=200)
    
    # Returns False if email doesn't exist or isn't provided
    return JsonResponse({"exists": False}, status=200)