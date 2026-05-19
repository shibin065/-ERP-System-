from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, BatchViewSet

router = DefaultRouter()
router.register(r'courses', CourseViewSet)
router.register(r'batches', BatchViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
