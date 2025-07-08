import fitz
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

class PDFUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)  # ✅ This is required for file upload

    def post(self, request):
        print("POST request received!")  # Debugging output

        if 'file' not in request.FILES:
            return Response({"error": "No file provided."}, status=400)

        doc = request.FILES['file']
        file_bytes = doc.read()
        pdf_doc = fitz.open(stream=file_bytes, filetype="pdf")

        extracted_text = ""
        for page in pdf_doc:
            extracted_text += page.get_text()

        pdf_doc.close()
        return Response({"extracted_text": extracted_text})
