from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AssignmentViewSet, AssignmentSubmissionViewSet

router = DefaultRouter()
router.register(r'list', AssignmentViewSet)
router.register(r'submissions', AssignmentSubmissionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
