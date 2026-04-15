from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view
import tempfile
import os
from .models import Book
from .serializers import BookSerializer, QuerySerializer
from .engine import scrape_and_process, rag_query, get_vectorstore, process_uploaded_book

class BookList(generics.ListAPIView):
    queryset = Book.objects.all()
    serializer_class = BookSerializer

class BookDetail(generics.RetrieveAPIView):
    queryset = Book.objects.all()
    serializer_class = BookSerializer

class BookRecommendations(APIView):
    def get(self, request, pk):
        try:
            book = Book.objects.get(pk=pk)
        except Book.DoesNotExist:
            return Response({'error': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Recommendation Logic: "If you like X, you'll like Y"
        # We can implement this by either finding books with the same genre,
        # or performing a vector search using the book's description.
        # Let's use ChromaDB vector similarity.
        vectorstore = get_vectorstore()
        search_query = f"Genre: {book.genre} Description: {book.description}"
        results = vectorstore.similarity_search(search_query, k=5)
        
        # Extract book IDs from metadata, excluding the current book
        recommended_ids = set()
        for doc in results:
            b_id = doc.metadata.get('book_id')
            if b_id and b_id != book.id:
                recommended_ids.add(b_id)
                
        recommendations = Book.objects.filter(id__in=recommended_ids)
        serializer = BookSerializer(recommendations, many=True)
        return Response(serializer.data)

class ScrapeBooks(APIView):
    def post(self, request):
        uploaded_file = request.FILES.get('file')
        if uploaded_file:
            try:
                filename = uploaded_file.name
                with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1]) as temp_file:
                    for chunk in uploaded_file.chunks():
                        temp_file.write(chunk)
                    temp_path = temp_file.name
                
                try:
                    processed_title = process_uploaded_book(temp_path, filename)
                finally:
                    if os.path.exists(temp_path):
                        os.unlink(temp_path)
                        
                return Response({"status": "success", "processed_books": [processed_title]})
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            try:
                processed = scrape_and_process()
                return Response({"status": "success", "processed_books": processed})
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RAGQuery(APIView):
    def post(self, request):
        serializer = QuerySerializer(data=request.data)
        if serializer.is_valid():
            question = serializer.validated_data['query']
            try:
                answer = rag_query(question)
                return Response({'answer': answer})
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
