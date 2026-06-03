import datetime
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Fee
from .serializers import FeeSerializer
from audit_logs.models import AuditLog
from notifications.models import Notification

class FeeViewSet(viewsets.ModelViewSet):
    queryset = Fee.objects.all()
    serializer_class = FeeSerializer
    permission_classes = (IsAuthenticated,)
    
    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset

        # If student, only show their own fees
        if user.role == 'student':
            return queryset.filter(student=user)

        student_id = self.request.query_params.get('student', None)
        if student_id:
            return queryset.filter(student_id=student_id)
        return queryset

    @action(detail=True, methods=['post'], url_path='pay')
    def process_payment(self, request, pk=None):
        """
        Simulate an online payment for a specific fee bill.
        """
        try:
            fee = self.get_object()
        except Fee.DoesNotExist:
            return Response({"error": "Fee record not found."}, status=status.HTTP_404_NOT_FOUND)

        if fee.status == 'paid':
            return Response({"error": "This fee bill has already been paid."}, status=status.HTTP_400_BAD_REQUEST)

        # Process payment (mock)
        fee.status = 'paid'
        fee.payment_date = datetime.date.today()
        fee.save()

        # Write to Audit Log
        AuditLog.objects.create(
            user=request.user,
            action='fee_payment',
            details=f"Paid fee: {fee.description} - Amount: ${fee.amount} for student: {fee.student.username}"
        )

        # Send System Notification
        Notification.objects.create(
            user=fee.student,
            title='Fee Payment Received',
            message=f"Thank you! Your payment of ${fee.amount} for '{fee.description}' has been successfully processed.",
            notification_type='fee'
        )

        # Return invoice/receipt metadata
        receipt_data = {
            "receipt_number": f"REC-{fee.id}-{datetime.datetime.now().strftime('%Y%m%d')}",
            "payment_date": fee.payment_date.strftime("%Y-%m-%d"),
            "student_name": fee.student.username,
            "student_email": fee.student.email,
            "amount": float(fee.amount),
            "description": fee.description,
            "payment_method": request.data.get('payment_method', 'Mock Visa (•••• 4242)'),
            "status": "PAID"
        }

        return Response({
            "message": "Payment processed successfully.",
            "receipt": receipt_data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='receipt')
    def get_receipt(self, request, pk=None):
        """
        Fetch receipt metadata for a paid fee bill.
        """
        try:
            fee = self.get_object()
        except Fee.DoesNotExist:
            return Response({"error": "Fee record not found."}, status=status.HTTP_404_NOT_FOUND)

        if fee.status != 'paid':
            return Response({"error": "Receipt only available for paid fee bills."}, status=status.HTTP_400_BAD_REQUEST)

        receipt_data = {
            "receipt_number": f"REC-{fee.id}-{fee.payment_date.strftime('%Y%m%d') if fee.payment_date else '000000'}",
            "payment_date": fee.payment_date.strftime("%Y-%m-%d") if fee.payment_date else "N/A",
            "student_name": fee.student.username,
            "student_email": fee.student.email,
            "amount": float(fee.amount),
            "description": fee.description,
            "payment_method": "Visa Credit Card (•••• 4242)",
            "status": "PAID"
        }

        return Response(receipt_data, status=status.HTTP_200_OK)
