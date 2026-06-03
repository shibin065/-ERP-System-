from django.db import models
from django.conf import settings
from academics.models import Course, Batch

class Assignment(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='assignments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='assignments')
    due_date = models.DateTimeField()
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'staff'},
        related_name='created_assignments'
    )
    file_attachment = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"{self.title} - {self.batch.name}"

class AssignmentSubmission(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'student'},
        related_name='submissions'
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    submission_file = models.CharField(max_length=255, blank=True, null=True)
    grade = models.CharField(max_length=10, blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('assignment', 'student')

    def __str__(self):
        return f"{self.student.username} - {self.assignment.title}"
