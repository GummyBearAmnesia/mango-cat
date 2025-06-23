from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
@api_view(['POST'])
def login(request):
    '''
    Authenticate a user and return the JWT Tokens if credentials are deemed valid
    '''
    # GET email and passwork from the request
    email = request.data.get('email')
    password = request.data.get('password')

    # Authenticate the User
    user = authenticate(request, email=email, password=password)

    if user:
        # Generate JWT Tokens for the authenticated User
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'userId': user.id,
            'username': user.username,  # Return the username
        })
    # Return an error response if the authentication fails 
    return Response({'error': 'Invalid Credentials'}, status=400)