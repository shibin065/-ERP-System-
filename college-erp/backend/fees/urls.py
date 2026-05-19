from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FeeViewSet

router = DefaultRouter()
router.register(r'records', FeeViewSet, basename='fee')

urlpatterns = [
    path('', include(router.urls)),
]
