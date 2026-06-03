from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import LeaveRequest
from .serializers import LeaveRequestSerializer

class LeaveRequestViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.all()
    serializer_class = LeaveRequestSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset
        
        # If student, only show their own leaves
        if user.role == 'student':
            return queryset.filter(user=user)
        # If staff, show their own leaves and any leave requests from students (for approval)
        elif user.role == 'staff':
            # Staff can review student leaves, and see their own requests
            return queryset.filter(user=user) | queryset.filter(user__role='student')
        
        # Admins can see all leaves
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], url_path='approve')
    def approve_leave(self, request, pk=None):
        """
        Action to approve a leave request.
        """
        try:
            leave = self.get_object()
        except LeaveRequest.DoesNotExist:
            return Response({"error": "Leave request not found."}, status=status.HTTP_404_NOT_FOUND)

        if request.user.role not in ['admin', 'staff']:
            return Response({"error": "You do not have permission to approve leaves."}, status=status.HTTP_403_FORBIDDEN)

        # Staff can only approve student leaves, admin can approve all
        if request.user.role == 'staff' and leave.user.role != 'student':
            return Response({"error": "Staff can only approve student leave requests."}, status=status.HTTP_403_FORBIDDEN)

        if leave.status != 'pending':
            return Response({"error": f"Leave request is already {leave.status}."}, status=status.HTTP_400_BAD_REQUEST)

        leave.status = 'approved'
        leave.action_by = request.user
        leave.action_date = timezone.now()
        leave.save()

        return Response(LeaveRequestSerializer(leave).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='reject')
    def reject_leave(self, request, pk=None):
        """
        Action to reject a leave request.
        """
        try:
            leave = self.get_object()
        except LeaveRequest.DoesNotExist:
            return Response({"error": "Leave request not found."}, status=status.HTTP_404_NOT_FOUND)

        if request.user.role not in ['admin', 'staff']:
            return Response({"error": "You do not have permission to reject leaves."}, status=status.HTTP_403_FORBIDDEN)

        if request.user.role == 'staff' and leave.user.role != 'student':
            return Response({"error": "Staff can only reject student leave requests."}, status=status.HTTP_403_FORBIDDEN)

        if leave.status != 'pending':
            return Response({"error": f"Leave request is already {leave.status}."}, status=status.HTTP_400_BAD_REQUEST)

        leave.status = 'rejected'
        leave.action_by = request.user
        leave.action_date = timezone.now()
        leave.save()

        return Response(LeaveRequestSerializer(leave).data, status=status.HTTP_200_OK)
