from rest_framework import serializers
from .models import Company, JobDrive, PlacementApplication
from users.serializers import UserSerializer

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = '__all__'

class JobDriveSerializer(serializers.ModelSerializer):
    company_detail = CompanySerializer(source='company', read_only=True)
    applications_count = serializers.SerializerMethodField()

    class Meta:
        model = JobDrive
        fields = '__all__'

    def get_applications_count(self, obj):
        return obj.applications.count()

class PlacementApplicationSerializer(serializers.ModelSerializer):
    student_detail = UserSerializer(source='student', read_only=True)
    job_drive_detail = JobDriveSerializer(source='job_drive', read_only=True)

    class Meta:
        model = PlacementApplication
        fields = '__all__'
