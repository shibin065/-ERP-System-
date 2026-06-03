from rest_framework import serializers
from .models import Event
from users.serializers import UserSerializer

class EventSerializer(serializers.ModelSerializer):
    registered_students_detail = UserSerializer(source='registered_students', many=True, read_only=True)
    is_registered = serializers.SerializerMethodField()
    registered_count = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = '__all__'

    def get_registered_count(self, obj):
        return obj.registered_students.count()

    def get_is_registered(self, obj):
        request = self.context.get('request', None)
        if request and request.user.is_authenticated:
            return obj.registered_students.filter(id=request.user.id).exists()
        return False
