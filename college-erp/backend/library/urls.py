from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookViewSet, BorrowRecordViewSet

router = DefaultRouter()
router.register(r'books', BookViewSet, basename='book')
router.register(r'borrows', BorrowRecordViewSet, basename='borrow')

urlpatterns = [
    path('', include(router.urls)),
]
