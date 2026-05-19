from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Course, Batch
from .serializers import CourseSerializer, BatchSerializer

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = (IsAuthenticated,)

class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.all()
    serializer_class = BatchSerializer
    permission_classes = (IsAuthenticated,)
