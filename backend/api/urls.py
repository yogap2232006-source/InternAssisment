from django.urls import path
from .views import BookList, BookDetail, BookRecommendations, ScrapeBooks, RAGQuery

urlpatterns = [
    path('books/', BookList.as_view(), name='book-list'),
    path('books/<int:pk>/', BookDetail.as_view(), name='book-detail'),
    path('books/<int:pk>/recommendations/', BookRecommendations.as_view(), name='book-recommendations'),
    path('books/upload/', ScrapeBooks.as_view(), name='scrape-books'),
    path('chat/', RAGQuery.as_view(), name='rag-query'),
]
