from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RoomViewSet, TimeSlotViewSet, TimetableViewSet

router = DefaultRouter()
router.register(r'rooms', RoomViewSet)
router.register(r'timeslots', TimeSlotViewSet)
router.register(r'schedules', TimetableViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
