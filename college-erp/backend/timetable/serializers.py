from rest_framework import serializers
from .models import Room, TimeSlot, Timetable
from academics.serializers import CourseSerializer, BatchSerializer
from users.serializers import UserSerializer

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = '__all__'

class TimeSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeSlot
        fields = '__all__'

class TimetableSerializer(serializers.ModelSerializer):
    room_detail = RoomSerializer(source='room', read_only=True)
    time_slot_detail = TimeSlotSerializer(source='time_slot', read_only=True)
    course_detail = CourseSerializer(source='course', read_only=True)
    faculty_detail = UserSerializer(source='faculty', read_only=True)
    batch_detail = BatchSerializer(source='batch', read_only=True)

    class Meta:
        model = Timetable
        fields = '__all__'
