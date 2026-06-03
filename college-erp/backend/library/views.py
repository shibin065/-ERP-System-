import datetime
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Book, BorrowRecord
from .serializers import BookSerializer, BorrowRecordSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        queryset = self.queryset
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(author__icontains=search) |
                Q(isbn__icontains=search)
            )
        return queryset

class BorrowRecordViewSet(viewsets.ModelViewSet):
    queryset = BorrowRecord.objects.all()
    serializer_class = BorrowRecordSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset
        if user.role == 'student':
            return queryset.filter(student=user)
        return queryset

    @action(detail=False, methods=['post'], url_path='issue')
    def issue_book(self, request):
        """
        Action to issue a book. Expects student_id (or requests student) and book_id.
        """
        book_id = request.data.get('book_id')
        student_id = request.data.get('student_id', None)
        
        # If student_id is not provided, default to current user if student
        if not student_id and request.user.role == 'student':
            student_id = request.user.id
            
        if not book_id or not student_id:
            return Response({"error": "Book ID and Student ID are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            book = Book.objects.get(id=book_id)
            student = User.objects.get(id=student_id, role='student')
        except (Book.DoesNotExist, User.DoesNotExist):
            return Response({"error": "Book or Student not found."}, status=status.HTTP_404_NOT_FOUND)

        if book.available_copies <= 0:
            return Response({"error": "No copies available for issue."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if already borrowed and not returned
        if BorrowRecord.objects.filter(book=book, student=student, status='borrowed').exists():
            return Response({"error": "Student has already borrowed this book and has not returned it yet."}, status=status.HTTP_400_BAD_REQUEST)

        # Issue book
        book.available_copies -= 1
        book.save()

        due_date = datetime.date.today() + datetime.timedelta(days=14) # 14 days default
        record = BorrowRecord.objects.create(
            book=book,
            student=student,
            due_date=due_date,
            status='borrowed'
        )

        return Response(BorrowRecordSerializer(record).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='return')
    def return_book(self, request, pk=None):
        """
        Action to return a borrowed book and compute any fines.
        """
        try:
            record = self.get_object()
        except BorrowRecord.DoesNotExist:
            return Response({"error": "Record not found."}, status=status.HTTP_404_NOT_FOUND)

        if record.status == 'returned':
            return Response({"error": "Book has already been returned."}, status=status.HTTP_400_BAD_REQUEST)

        record.return_date = datetime.date.today()
        record.fine_amount = record.calculate_fine()
        record.status = 'returned'
        record.save()

        # Update available copies
        book = record.book
        book.available_copies += 1
        book.save()

        return Response({
            "message": "Book returned successfully.",
            "fine_amount": record.fine_amount,
            "record": BorrowRecordSerializer(record).data
        }, status=status.HTTP_200_OK)
