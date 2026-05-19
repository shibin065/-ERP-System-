from rest_framework import serializers
from .models import Notice

class NoticeSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    batch_name = serializers.CharField(source='target_batch.name', read_only=True, allow_null=True)

    class Meta:
        model = Notice
        fields = '__all__'
