from django.db import models
from django.conf import settings
from academics.models import Batch

class Attendance(models.Model):
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='attendances')
    date = models.DateField()
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'student'}
    )
    is_present = models.BooleanField(default=True)
    remarks = models.CharField(max_length=200, blank=True)

    class Meta:
        unique_together = ('batch', 'date', 'student')

    def __str__(self):
        return f"{self.student.username} - {self.batch.name} - {self.date}"
