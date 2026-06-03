from django.db import models
from django.conf import settings

class Company(models.Model):
    name = models.CharField(max_length=200)
    industry = models.CharField(max_length=150)
    website = models.URLField(blank=True, null=True)

    def __str__(self):
        return self.name

class JobDrive(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('completed', 'Completed'),
    )
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='drives')
    role_name = models.CharField(max_length=150)
    package_lpa = models.DecimalField(max_digits=5, decimal_places=2, help_text="Package per annum (e.g. 12.50 LPA)")
    drive_date = models.DateField()
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    def __str__(self):
        return f"{self.company.name} - {self.role_name}"

class PlacementApplication(models.Model):
    STATUS_CHOICES = (
        ('applied', 'Applied'),
        ('shortlisted', 'Shortlisted'),
        ('interviewed', 'Interviewed'),
        ('placed', 'Placed'),
        ('rejected', 'Rejected'),
    )
    job_drive = models.ForeignKey(JobDrive, on_delete=models.CASCADE, related_name='applications')
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'student'},
        related_name='placement_applications'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='applied')
    applied_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('job_drive', 'student')

    def __str__(self):
        return f"{self.student.username} - {self.job_drive.company.name} ({self.status})"
