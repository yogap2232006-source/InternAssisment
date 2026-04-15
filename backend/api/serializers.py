from rest_framework import serializers
from .models import Book

class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = '__all__'

class QuerySerializer(serializers.Serializer):
    query = serializers.CharField(required=True)
