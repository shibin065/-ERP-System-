from django.db import models
from django.conf import settings

class LeaveRequest(models.Model):
    LEAVE_TYPES = (
        ('sick', 'Sick Leave'),
        ('casual', 'Casual Leave'),
        ('annual', 'Annual Leave'),
    )
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='leaves')
    leave_type = models.CharField(max_length=20, choices=LEAVE_TYPES, default='casual')
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    action_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='acted_leaves'
    )
    action_date = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.leave_type}: {self.status}"
