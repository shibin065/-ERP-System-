from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from users.models import CustomUser
from academics.models import Course, Batch
from attendance.models import Attendance
from fees.models import Fee

class DashboardSummaryView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        user = request.user
        data = {}
        if user.role == 'admin':
            data['total_students'] = CustomUser.objects.filter(role='student').count()
            data['total_staff'] = CustomUser.objects.filter(role='staff').count()
            data['total_courses'] = Course.objects.count()
            
            pending_fees = Fee.objects.filter(status='pending')
            data['pending_fees'] = sum([f.amount for f in pending_fees])
        elif user.role == 'student':
            data['my_attendances'] = Attendance.objects.filter(student=user).count()
            
            my_pending_fees = Fee.objects.filter(student=user, status='pending')
            data['my_pending_fees'] = sum([f.amount for f in my_pending_fees])
        elif user.role == 'staff':
            data['total_students'] = CustomUser.objects.filter(role='student').count()
            data['total_courses'] = Course.objects.count()
        
        return Response(data)
