from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Exam, Result
from .serializers import ExamSerializer, ResultSerializer

class ExamViewSet(viewsets.ModelViewSet):
    queryset = Exam.objects.all()
    serializer_class = ExamSerializer
    permission_classes = (IsAuthenticated,)

class ResultViewSet(viewsets.ModelViewSet):
    queryset = Result.objects.all()
    serializer_class = ResultSerializer
    permission_classes = (IsAuthenticated,)
