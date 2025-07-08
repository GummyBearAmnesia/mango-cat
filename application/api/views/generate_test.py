#from api.models import Friends, Status, User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
import cohere
import os

class generateTestsView(APIView):
    def get(self, request):

        query_text = request.GET.get('q', 'What is a mango cat')

        print(query_text)

        co = cohere.Client(os.getenv('CO_API_KEY'))
        response = co.generate(
            prompt=query_text,
            max_tokens=50,
            temperature=0.7,
            k=0,
            stop_sequences=["--"],
            return_likelihoods="NONE",
        )
        # response = co.generate(
        #     prompt="Please explain to me how LLMs work",
        # )
        generated_text = response.generations[0].text

        # Return as JSON response
        return Response({"generated_text": generated_text})


