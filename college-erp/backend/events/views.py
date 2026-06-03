from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Event
from .serializers import EventSerializer

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        queryset = self.queryset
        upcoming_only = self.request.query_params.get('upcoming', None)
        if upcoming_only == 'true':
            queryset = queryset.filter(date__gte=timezone.now())
        return queryset

    @action(detail=True, methods=['post'], url_path='register')
    def register_for_event(self, request, pk=None):
        """
        Reregisters the authenticated student for this event.
        """
        try:
            event = self.get_object()
        except Event.DoesNotExist:
            return Response({"error": "Event not found."}, status=status.HTTP_404_NOT_FOUND)

        if request.user.role != 'student':
            return Response({"error": "Only students can register for events."}, status=status.HTTP_403_FORBIDDEN)

        if event.registered_students.count() >= event.capacity:
            return Response({"error": "This event has reached full capacity."}, status=status.HTTP_400_BAD_REQUEST)

        if event.registered_students.filter(id=request.user.id).exists():
            return Response({"error": "You are already registered for this event."}, status=status.HTTP_400_BAD_REQUEST)

        event.registered_students.add(request.user)
        return Response({"message": "Successfully registered for event.", "is_registered": True}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='unregister')
    def unregister_from_event(self, request, pk=None):
        """
        Unregisters the authenticated student from this event.
        """
        try:
            event = self.get_object()
        except Event.DoesNotExist:
            return Response({"error": "Event not found."}, status=status.HTTP_404_NOT_FOUND)

        if not event.registered_students.filter(id=request.user.id).exists():
            return Response({"error": "You are not registered for this event."}, status=status.HTTP_400_BAD_REQUEST)

        event.registered_students.remove(request.user)
        return Response({"message": "Successfully unregistered from event.", "is_registered": False}, status=status.HTTP_200_OK)
