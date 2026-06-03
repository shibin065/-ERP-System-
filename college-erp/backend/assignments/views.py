from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Assignment, AssignmentSubmission
from .serializers import AssignmentSerializer, AssignmentSubmissionSerializer

class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset
        
        batch_id = self.request.query_params.get('batch', None)
        if batch_id:
            queryset = queryset.filter(batch_id=batch_id)

        if user.role == 'student':
            # Only show assignments for the student's batch
            return queryset.filter(batch__students__id=user.id)
        elif user.role == 'staff':
            # Show assignments created by this staff member, or all
            return queryset.filter(created_by=user)
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class AssignmentSubmissionViewSet(viewsets.ModelViewSet):
    queryset = AssignmentSubmission.objects.all()
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset

        assignment_id = self.request.query_params.get('assignment', None)
        if assignment_id:
            queryset = queryset.filter(assignment_id=assignment_id)

        if user.role == 'student':
            # Students can only see their own submissions
            return queryset.filter(student=user)
        # Staff can see all submissions
        return queryset

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)
        
    def create(self, request, *args, **kwargs):
        # Prevent multiple submissions for same assignment by same student
        assignment_id = request.data.get('assignment')
        if AssignmentSubmission.objects.filter(assignment_id=assignment_id, student=request.user).exists():
            return Response(
                {"detail": "You have already submitted this assignment. Please modify your existing submission if needed."},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().create(request, *args, **kwargs)
