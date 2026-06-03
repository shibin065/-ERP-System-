from rest_framework import serializers
from .models import Assignment, AssignmentSubmission
from academics.serializers import CourseSerializer, BatchSerializer
from users.serializers import UserSerializer

class AssignmentSerializer(serializers.ModelSerializer):
    course_detail = CourseSerializer(source='course', read_only=True)
    batch_detail = BatchSerializer(source='batch', read_only=True)
    created_by_detail = UserSerializer(source='created_by', read_only=True)
    submissions_count = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = '__all__'

    def get_submissions_count(self, obj):
        return obj.submissions.count()

class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    student_detail = UserSerializer(source='student', read_only=True)
    assignment_detail = AssignmentSerializer(source='assignment', read_only=True)

    class Meta:
        model = AssignmentSubmission
        fields = '__all__'
