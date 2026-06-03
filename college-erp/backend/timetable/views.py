from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Room, TimeSlot, Timetable
from academics.models import Course, Batch
from django.contrib.auth import get_user_model
from .serializers import RoomSerializer, TimeSlotSerializer, TimetableSerializer

User = get_user_model()

class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = (IsAuthenticated,)

class TimeSlotViewSet(viewsets.ModelViewSet):
    queryset = TimeSlot.objects.all()
    serializer_class = TimeSlotSerializer
    permission_classes = (IsAuthenticated,)

class TimetableViewSet(viewsets.ModelViewSet):
    queryset = Timetable.objects.all()
    serializer_class = TimetableSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        queryset = self.queryset
        batch_id = self.request.query_params.get('batch', None)
        faculty_id = self.request.query_params.get('faculty', None)
        student_id = self.request.query_params.get('student', None)

        if batch_id:
            queryset = queryset.filter(batch_id=batch_id)
        if faculty_id:
            queryset = queryset.filter(faculty_id=faculty_id)
        if student_id:
            # Filter timetables of batches containing the student
            queryset = queryset.filter(batch__students__id=student_id)
            
        return queryset

    @action(detail=False, methods=['post'], url_path='generate')
    def generate_timetable(self, request):
        """
        Smart scheduler logic: Automatically schedules courses into empty time slots & rooms.
        """
        batches = Batch.objects.all()
        courses = Course.objects.all()
        faculties = User.objects.filter(role='staff')
        rooms = Room.objects.all()
        slots = TimeSlot.objects.all()

        if not rooms.exists() or not slots.exists() or not faculties.exists() or not courses.exists():
            return Response(
                {"error": "Please ensure Rooms, Time Slots, Faculty, and Courses are set up first."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Clear existing timetable
        Timetable.objects.all().delete()

        created_count = 0
        used_combinations = set() # (room_id, slot_id) and (faculty_id, slot_id) and (batch_id, slot_id)

        for batch in batches:
            slot_idx = 0
            for course in courses[:3]: # Limit to 3 courses per batch for mockup simplicity
                if slot_idx >= slots.count():
                    break
                
                # Find available slot and room
                scheduled = False
                attempts = 0
                while not scheduled and attempts < slots.count():
                    slot = slots[(slot_idx + attempts) % slots.count()]
                    room = rooms[random_selector(rooms.count(), batch.id + course.id)]
                    faculty = faculties[random_selector(faculties.count(), course.id)]

                    # Constraints check:
                    room_slot = f"r-{room.id}-s-{slot.id}"
                    fac_slot = f"f-{faculty.id}-s-{slot.id}"
                    bat_slot = f"b-{batch.id}-s-{slot.id}"

                    if room_slot not in used_combinations and fac_slot not in used_combinations and bat_slot not in used_combinations:
                        Timetable.objects.create(
                            batch=batch,
                            course=course,
                            faculty=faculty,
                            room=room,
                            time_slot=slot
                        )
                        used_combinations.add(room_slot)
                        used_combinations.add(fac_slot)
                        used_combinations.add(bat_slot)
                        created_count += 1
                        scheduled = True
                    attempts += 1
                
                slot_idx += 1

        return Response({"message": f"Successfully generated {created_count} timetable entries.", "count": created_count})

def random_selector(limit, seed_offset):
    # Simple deterministic pseudorandom selection
    return (seed_offset * 17) % limit
