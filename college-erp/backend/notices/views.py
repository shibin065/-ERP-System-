from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Notice
from .serializers import NoticeSerializer

class NoticeViewSet(viewsets.ModelViewSet):
    queryset = Notice.objects.all()
    serializer_class = NoticeSerializer
    permission_classes = (IsAuthenticated,)
    
    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset
        if getattr(user, 'role', '') == 'student':
            # student sees global + their batch notices
            queryset = queryset.filter(Q(target_batch__isnull=True) | Q(target_batch__in=user.batches.all()))
        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
