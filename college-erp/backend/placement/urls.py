from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompanyViewSet, JobDriveViewSet, PlacementApplicationViewSet

router = DefaultRouter()
router.register(r'companies', CompanyViewSet)
router.register(r'drives', JobDriveViewSet)
router.register(r'applications', PlacementApplicationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
