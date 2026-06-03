from rest_framework import serializers
from .models import AuditLog
from users.serializers import UserSerializer

class AuditLogSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source='user', read_only=True)

    class Meta:
        model = AuditLog
        fields = '__all__'
