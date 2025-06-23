from rest_framework.response import Response
from rest_framework.decorators import api_view
from ..models.motivational_message import MotivationalMessage
from random import randint


@api_view(['GET'])
def motivationalMessage(request):
    '''
    Fetch and return a random motivational message from the database
    '''
    # Get the ID of the first message and total number of messages
    start = (MotivationalMessage.objects.first()).id
    numMessages = MotivationalMessage.objects.count()

    # GET a random message using a ransom ID within the given range
    motivation = MotivationalMessage.objects.get(id = randint(start, start+numMessages-1))
    message = motivation.text

    # Return the message
    return Response({'message': message})