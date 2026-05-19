from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Attendance
from .serializers import AttendanceSerializer

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = (IsAuthenticated,)
    
    def get_queryset(self):
        queryset = self.queryset
        student_id = self.request.query_params.get('student', None)
        batch_id = self.request.query_params.get('batch', None)
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if batch_id:
            queryset = queryset.filter(batch_id=batch_id)
        return queryset
