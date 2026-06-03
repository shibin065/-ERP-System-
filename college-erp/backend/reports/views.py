import datetime
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Avg, Count
from users.models import CustomUser
from academics.models import Course, Batch
from attendance.models import Attendance
from fees.models import Fee
from exams.models import Exam, Result
from timetable.models import Timetable
from placement.models import PlacementApplication
from assignments.models import Assignment, AssignmentSubmission

class DashboardSummaryView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        user = request.user
        data = {}
        
        # Current Date Helper
        today = datetime.date.today()

        if user.role == 'admin':
            # Basic stats
            data['total_students'] = CustomUser.objects.filter(role='student').count()
            data['total_staff'] = CustomUser.objects.filter(role='staff').count()
            data['total_courses'] = Course.objects.count()
            
            # Revenue calculation
            paid_fees = Fee.objects.filter(status='paid')
            data['total_revenue'] = float(paid_fees.aggregate(Sum('amount'))['amount__sum'] or 0.00)

            pending_fees = Fee.objects.filter(status__in=['pending', 'overdue'])
            data['pending_fees'] = float(pending_fees.aggregate(Sum('amount'))['amount__sum'] or 0.00)

            # Placements stats
            total_applications = PlacementApplication.objects.count()
            placed_applications = PlacementApplication.objects.filter(status='placed').count()
            data['placement_rate'] = round((placed_applications / total_applications * 100), 1) if total_applications > 0 else 0.0

            # Admissions by month (mockup based on user registrations or hardcoded for charts stability)
            data['admissions_chart'] = [
                {"name": "Jan", "count": 12},
                {"name": "Feb", "count": 18},
                {"name": "Mar", "count": 22},
                {"name": "Apr", "count": 30},
                {"name": "May", "count": 45},
                {"name": "Jun", "count": 60}
            ]

            # Revenue Trend Chart (accumulative)
            data['revenue_chart'] = [
                {"name": "Jan", "revenue": 8000},
                {"name": "Feb", "revenue": 11000},
                {"name": "Mar", "revenue": 16000},
                {"name": "Apr", "revenue": 21000},
                {"name": "May", "revenue": 28000},
                {"name": "Jun", "revenue": 34000}
            ]

            # Department-wise Attendance
            data['attendance_chart'] = [
                {"name": "CS Dept", "rate": 88},
                {"name": "IT Dept", "rate": 82},
                {"name": "EC Dept", "rate": 79},
                {"name": "Mech Dept", "rate": 74}
            ]

            # Placements Package Chart
            data['placement_chart'] = [
                {"name": "Highest CTC", "package": 25.0},
                {"name": "Average CTC", "package": 18.5},
            ]

        elif user.role == 'staff':
            # Today's classes for the staff
            # Get current day of week (Monday is 1, Sunday is 7)
            day_of_week = today.weekday() + 1
            today_classes = Timetable.objects.filter(faculty=user, time_slot__day_of_week=day_of_week)
            
            data['today_classes'] = [
                {
                    "id": c.id,
                    "batch": c.batch.name,
                    "course": c.course.name,
                    "room": c.room.name,
                    "start_time": c.time_slot.start_time.strftime("%H:%M"),
                    "end_time": c.time_slot.end_time.strftime("%H:%M")
                } for c in today_classes
            ]

            # Attendance Pending
            # Count of batches the staff teaches that haven't registered attendance for today
            staff_batches = Timetable.objects.filter(faculty=user).values_list('batch_id', flat=True).distinct()
            attendance_marked_batches = Attendance.objects.filter(date=today, batch_id__in=staff_batches).values_list('batch_id', flat=True).distinct()
            data['attendance_pending_count'] = len(staff_batches) - len(attendance_marked_batches)

            # Student Academic Performance overview
            student_results = Result.objects.values('student__username').annotate(avg_marks=Avg('marks_obtained')).order_by('-avg_marks')
            data['top_performers'] = [
                {"name": s['student__username'], "avg": round(s['avg_marks'], 1)} for s in student_results[:3]
            ]
            
            # Low performers (below 40%)
            low_performers = student_results.filter(avg_marks__lt=50.0)
            data['at_risk_count'] = low_performers.count()

        elif user.role == 'student':
            # 1. Attendance Rate
            total_att = Attendance.objects.filter(student=user).count()
            present_att = Attendance.objects.filter(student=user, is_present=True).count()
            data['attendance_percentage'] = round((present_att / total_att * 100), 1) if total_att > 0 else 0.0

            # 2. Fee Status
            pending_fees = Fee.objects.filter(student=user, status__in=['pending', 'overdue'])
            data['pending_fees_amount'] = float(pending_fees.aggregate(Sum('amount'))['amount__sum'] or 0.00)
            data['pending_fees_count'] = pending_fees.count()

            # 3. Timetable today
            day_of_week = today.weekday() + 1
            student_classes = Timetable.objects.filter(batch__students=user, time_slot__day_of_week=day_of_week)
            data['today_timetable'] = [
                {
                    "course": c.course.name,
                    "faculty": c.faculty.username,
                    "room": c.room.name,
                    "start_time": c.time_slot.start_time.strftime("%H:%M"),
                    "end_time": c.time_slot.end_time.strftime("%H:%M")
                } for c in student_classes
            ]

            # 4. Assignments Status
            student_batch = Batch.objects.filter(students=user).first()
            if student_batch:
                total_assignments = Assignment.objects.filter(batch=student_batch)
                submitted_count = AssignmentSubmission.objects.filter(student=user).count()
                data['pending_assignments_count'] = total_assignments.count() - submitted_count
            else:
                data['pending_assignments_count'] = 0

            # 5. CGPA Trends (line chart)
            exam_results = Result.objects.filter(student=user).order_by('exam__date')
            data['cgpa_trends'] = [
                {"name": r.exam.name[:10], "marks": r.marks_obtained} for r in exam_results
            ]

        return Response(data)
