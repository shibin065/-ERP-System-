from rest_framework import serializers
from .models import Book, BorrowRecord

class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = '__all__'

from users.serializers import UserSerializer

class BorrowRecordSerializer(serializers.ModelSerializer):
    book_detail = BookSerializer(source='book', read_only=True)
    student_detail = UserSerializer(source='student', read_only=True)

    class Meta:
        model = BorrowRecord
        fields = '__all__'
