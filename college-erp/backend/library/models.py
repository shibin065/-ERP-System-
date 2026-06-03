from django.db import models
from django.conf import settings

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=150)
    isbn = models.CharField(max_length=20, unique=True)
    total_copies = models.IntegerField(default=1)
    available_copies = models.IntegerField(default=1)

    def __str__(self):
        return self.title

class BorrowRecord(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='borrows')
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'student'}
    )
    borrow_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    return_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=(
        ('borrowed', 'Borrowed'),
        ('returned', 'Returned'),
        ('overdue', 'Overdue')
    ), default='borrowed')
    fine_amount = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)

    def calculate_fine(self):
        # Calculates fine if return date or current date is past due date ($1/day overdue)
        import datetime
        end_date = self.return_date if self.return_date else datetime.date.today()
        if end_date > self.due_date:
            days_overdue = (end_date - self.due_date).days
            return days_overdue * 1.00
        return 0.00

    def __str__(self):
        return f"{self.book.title} borrowed by {self.student.username}"
