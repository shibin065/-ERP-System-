"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/academics/', include('academics.urls')),
    path('api/attendance/', include('attendance.urls')),
    path('api/exams/', include('exams.urls')),
    path('api/fees/', include('fees.urls')),
    path('api/notices/', include('notices.urls')),
    path('api/library/', include('library.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/timetable/', include('timetable.urls')),
    path('api/assignments/', include('assignments.urls')),
    path('api/placement/', include('placement.urls')),
    path('api/events/', include('events.urls')),
    path('api/leaves/', include('leaves.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/audit_logs/', include('audit_logs.urls')),
    path('api/ai/', include('ai_features.urls')),
]
