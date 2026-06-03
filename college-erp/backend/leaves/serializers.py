from rest_framework import serializers
from .models import LeaveRequest
from users.serializers import UserSerializer

class LeaveRequestSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source='user', read_only=True)
    action_by_detail = UserSerializer(source='action_by', read_only=True)

    class Meta:
        model = LeaveRequest
        fields = '__all__'
