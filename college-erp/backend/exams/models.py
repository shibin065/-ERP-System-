from django.db import models
from django.conf import settings
from academics.models import Course, Batch

class Exam(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='exams')
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='exams')
    name = models.CharField(max_length=150)
    date = models.DateField()
    max_marks = models.IntegerField(default=100)

    def __str__(self):
        return f"{self.name} - {self.batch.name}"

class Result(models.Model):
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='results')
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'student'},
        related_name='exam_results'
    )
    marks_obtained = models.FloatField()
    remarks = models.TextField(blank=True)

    class Meta:
        unique_together = ('exam', 'student')

    def __str__(self):
        return f"{self.student.username} - {self.exam.name}: {self.marks_obtained}"
