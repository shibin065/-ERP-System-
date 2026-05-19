from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Fee
from .serializers import FeeSerializer

class FeeViewSet(viewsets.ModelViewSet):
    queryset = Fee.objects.all()
    serializer_class = FeeSerializer
    permission_classes = (IsAuthenticated,)
    
    def get_queryset(self):
        student_id = self.request.query_params.get('student', None)
        if student_id:
            return self.queryset.filter(student_id=student_id)
        return self.queryset
