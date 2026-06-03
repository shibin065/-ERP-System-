from django.db import models
from django.conf import settings

class Event(models.Model):
    EVENT_TYPES = (
        ('seminar', 'Seminar'),
        ('workshop', 'Workshop'),
        ('sports', 'Sports'),
        ('festival', 'Festival'),
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES, default='seminar')
    date = models.DateTimeField()
    location = models.CharField(max_length=200)
    organizer = models.CharField(max_length=150)
    capacity = models.IntegerField(default=100)
    registered_students = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        limit_choices_to={'role': 'student'},
        related_name='registered_events',
        blank=True
    )

    def __str__(self):
        return self.title
