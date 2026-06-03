from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import AuditLog
from .serializers import AuditLogSerializer

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = (IsAuthenticated,)

    def list(self, request, *args, **kwargs):
        # Enforce admin only
        if request.user.role != 'admin':
            return Response({"error": "Only administrators can view audit logs."}, status=status.HTTP_403_FORBIDDEN)
        return super().list(request, *args, **kwargs)
