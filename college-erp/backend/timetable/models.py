from django.db import models
from django.conf import settings
from academics.models import Course, Batch

class Room(models.Model):
    name = models.CharField(max_length=100)
    capacity = models.IntegerField(default=40)

    def __str__(self):
        return self.name

class TimeSlot(models.Model):
    DAY_CHOICES = (
        (1, 'Monday'),
        (2, 'Tuesday'),
        (3, 'Wednesday'),
        (4, 'Thursday'),
        (5, 'Friday'),
        (6, 'Saturday'),
        (7, 'Sunday'),
    )
    day_of_week = models.IntegerField(choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()

    def __str__(self):
        return f"{self.get_day_of_week_display()} ({self.start_time.strftime('%H:%M')} - {self.end_time.strftime('%H:%M')})"

class Timetable(models.Model):
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='timetables')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='timetables')
    faculty = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'staff'},
        related_name='faculty_timetables'
    )
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='timetables')
    time_slot = models.ForeignKey(TimeSlot, on_delete=models.CASCADE, related_name='timetables')

    class Meta:
        unique_together = ('batch', 'time_slot')

    def __str__(self):
        return f"{self.batch.name} - {self.course.name} - {self.time_slot}"
