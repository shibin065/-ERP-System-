from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Max, Avg, Count
from .models import Company, JobDrive, PlacementApplication
from .serializers import CompanySerializer, JobDriveSerializer, PlacementApplicationSerializer

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = (IsAuthenticated,)

class JobDriveViewSet(viewsets.ModelViewSet):
    queryset = JobDrive.objects.all()
    serializer_class = JobDriveSerializer
    permission_classes = (IsAuthenticated,)

    @action(detail=False, methods=['get'], url_path='statistics')
    def get_statistics(self, request):
        """
        Calculates placements cell analytics: highest package, average package, total placed, etc.
        """
        total_drives = JobDrive.objects.count()
        placed_students_count = PlacementApplication.objects.filter(status='placed').count()
        
        # Calculate highest/average packages
        packages = JobDrive.objects.filter(applications__status='placed')
        highest_pkg = packages.aggregate(Max('package_lpa'))['package_lpa__max'] or 0.00
        avg_pkg = packages.aggregate(Avg('package_lpa'))['package_lpa__avg'] or 0.00

        # Placed by company distribution
        company_stats = PlacementApplication.objects.filter(status='placed').values(
            'job_drive__company__name'
        ).annotate(count=Count('id')).order_by('-count')
        
        # Recruiter counts
        total_companies = Company.objects.count()

        return Response({
            "total_companies": total_companies,
            "total_drives": total_drives,
            "placed_students": placed_students_count,
            "highest_package": round(float(highest_pkg), 2),
            "average_package": round(float(avg_pkg), 2),
        }, status=status.HTTP_200_OK)

class PlacementApplicationViewSet(viewsets.ModelViewSet):
    queryset = PlacementApplication.objects.all()
    serializer_class = PlacementApplicationSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset
        
        job_drive_id = self.request.query_params.get('job_drive', None)
        if job_drive_id:
            queryset = queryset.filter(job_drive_id=job_drive_id)

        if user.role == 'student':
            # Students can only view their own placement applications
            return queryset.filter(student=user)
        return queryset

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

    def create(self, request, *args, **kwargs):
        # Prevent applying to the same drive multiple times
        job_drive_id = request.data.get('job_drive')
        if PlacementApplication.objects.filter(job_drive_id=job_drive_id, student=request.user).exists():
            return Response(
                {"detail": "You have already applied to this job drive."},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().create(request, *args, **kwargs)
