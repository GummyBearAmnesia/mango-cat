import fitz
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
import cohere
import os
class PDFUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)  # ✅ This is required for file upload
    correct_answers = False
    question = ""
    with_answer_format = ('['
                        '{'
                            '"question": "What is the capital of France?",'
                            '"options": ["Madrid", "Rome", "Berlin", "Paris"],'
                            '"correct_answer": "D"'
                        '},'
                            '...'
                     ']')

    only_question_format = ('['
                        '{'
                            '"question": "What is the capital of France?",'
                            '"options": ["Madrid", "Rome", "Berlin", "Paris"]'
                        '},'
                            '...'
                     ']')
    ai_answer = ''

    def post(self, request):
        print("POST request received!")  # Debugging output

        if 'file' not in request.FILES:
            return Response({"error": "No file provided."}, status=400)

        doc = request.FILES['file']
        self.correct_answers = request.POST.get('correct_answers')
        file_bytes = doc.read()
        pdf_doc = fitz.open(stream=file_bytes, filetype="pdf")

        extracted_text = ""
        for page in pdf_doc:
            extracted_text += page.get_text()

        pdf_doc.close()

        self.form_question(extracted_text)
        self.get_answer()

        print(self.ai_answer)

        return Response({"extracted_text": self.ai_answer})

    def form_question(self, text, num_of_question=10):

        self.question += "Use this material to form " + str(num_of_question) + " questions as it was an exam: " + text + "\n"
        self.question += "Write an answer strictly in this format without adding anything: \n"
        if self.correct_answers:
            self.question += self.with_answer_format + "\n"
        else:
            self.question += self.only_question_format + "\n"

    def get_answer(self):

        co = cohere.Client(os.getenv('CO_API_KEY'))
        response = co.generate(
            prompt=self.question,
            max_tokens=500,
            temperature=0.7,
            k=0,
            stop_sequences=["--"],
            return_likelihoods="NONE",
        )

        generated_text = response.generations[0].text

        self.ai_answer = generated_text


