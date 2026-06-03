from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from .serializers import NotificationSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        # Users can only see their own notifications
        return self.queryset.filter(user=self.request.user)

    @action(detail=True, methods=['post'], url_path='read')
    def mark_as_read(self, request, pk=None):
        """
        Mark a notification as read.
        """
        try:
            notification = self.get_object()
        except Notification.DoesNotExist:
            return Response({"error": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)

        notification.is_read = True
        notification.save()
        return Response({"message": "Notification marked as read.", "is_read": True}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='read-all')
    def mark_all_as_read(self, request):
        """
        Mark all user's notifications as read.
        """
        self.get_queryset().update(is_read=True)
        return Response({"message": "All notifications marked as read."}, status=status.HTTP_200_OK)
