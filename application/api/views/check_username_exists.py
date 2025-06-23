from django.http import JsonResponse
from api.models.user import User
from rest_framework.decorators import api_view

@api_view(['GET'])
def checkUsernameView(request):
    '''
    Checks if username already exists in the Database,
    Returns a JSON Response with boolean showing the existance of it.
    '''

    # Gets username usign query parameters
    username = request.query_params.get("username")

    # Checks if username exists in the User Model
    if username and User.objects.filter(username=username).exists():
        return JsonResponse({"exists": True}, status=200)
   
    # Returns False if username doesn't exist or isnt provided.
    return JsonResponse({"exists": False}, status=200)