from django.db import models
from django.conf import settings
from academics.models import Batch

class Notice(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    date_posted = models.DateTimeField(auto_now_add=True)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='authored_notices'
    )
    target_batch = models.ForeignKey(
        Batch,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notices'
    )

    class Meta:
        ordering = ['-date_posted']

    def __str__(self):
        return self.title
