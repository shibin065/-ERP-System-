import random
import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from academics.models import Course, Batch
from attendance.models import Attendance
from exams.models import Exam, Result
from fees.models import Fee
from library.models import Book, BorrowRecord
from timetable.models import Room, TimeSlot, Timetable
from placement.models import Company, JobDrive, PlacementApplication
from events.models import Event
from leaves.models import LeaveRequest
from notifications.models import Notification
from audit_logs.models import AuditLog

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with realistic mock data for the Smart Campus Management System'

    def handle(self, *args, **kwargs):
        self.stdout.write('Starting database seeding...')

        # 1. Create Users
        self.stdout.write('Seeding Users...')
        admin_user, _ = User.objects.get_or_create(username='admin', defaults={
            'email': 'admin@smartcampus.edu',
            'role': 'admin',
            'is_staff': True,
            'is_superuser': True
        })
        if _:
            admin_user.set_password('admin123')
            admin_user.save()

        staff1, _ = User.objects.get_or_create(username='dr_smith', defaults={
            'email': 'smith@smartcampus.edu',
            'role': 'staff',
            'is_staff': True
        })
        if _:
            staff1.set_password('staff123')
            staff1.save()

        staff2, _ = User.objects.get_or_create(username='prof_jones', defaults={
            'email': 'jones@smartcampus.edu',
            'role': 'staff',
            'is_staff': True
        })
        if _:
            staff2.set_password('staff123')
            staff2.save()

        # Students
        # student_high: Good grades, high attendance
        student_high, _ = User.objects.get_or_create(username='john_doe', defaults={
            'email': 'john@student.edu',
            'role': 'student'
        })
        if _:
            student_high.set_password('student123')
            student_high.save()

        # student_low_att: Poor attendance, decent grades
        student_low_att, _ = User.objects.get_or_create(username='sarah_lee', defaults={
            'email': 'sarah@student.edu',
            'role': 'student'
        })
        if _:
            student_low_att.set_password('student123')
            student_low_att.save()

        # student_poor_acad: High attendance, failing grades, overdue fees
        student_poor_acad, _ = User.objects.get_or_create(username='alex_kumar', defaults={
            'email': 'alex@student.edu',
            'role': 'student'
        })
        if _:
            student_poor_acad.set_password('student123')
            student_poor_acad.save()

        # 2. Create Courses and Batches
        self.stdout.write('Seeding Academics (Courses & Batches)...')
        cs_course, _ = Course.objects.get_or_create(code='CS101', defaults={
            'name': 'Computer Science & Engineering',
            'description': 'Department of Computer Science & Engineering'
        })
        it_course, _ = Course.objects.get_or_create(code='IT102', defaults={
            'name': 'Information Technology',
            'description': 'Department of Information Technology'
        })

        batch_cs, _ = Batch.objects.get_or_create(name='CSE-2026', defaults={
            'course': cs_course,
            'start_date': datetime.date(2023, 8, 1),
            'end_date': datetime.date(2027, 6, 30),
        })
        if _:
            batch_cs.students.add(student_high, student_low_att, student_poor_acad)

        batch_it, _ = Batch.objects.get_or_create(name='IT-2026', defaults={
            'course': it_course,
            'start_date': datetime.date(2023, 8, 1),
            'end_date': datetime.date(2027, 6, 30),
        })
        if _:
            batch_it.students.add(student_high)

        # 3. Attendance Seeding (30 days of data)
        self.stdout.write('Seeding Attendance records...')
        # Clear existing to ensure clean seed
        Attendance.objects.all().delete()
        
        today = datetime.date.today()
        students = [student_high, student_low_att, student_poor_acad]

        for i in range(30):
            date = today - datetime.timedelta(days=i)
            # Skip Sundays
            if date.weekday() == 6:
                continue

            # john_doe has 95% attendance
            Attendance.objects.create(
                batch=batch_cs,
                date=date,
                student=student_high,
                is_present=(random.random() < 0.95),
                remarks='Daily rollcall'
            )

            # sarah_lee has 60% attendance (Low Attendance Alert)
            Attendance.objects.create(
                batch=batch_cs,
                date=date,
                student=student_low_att,
                is_present=(random.random() < 0.60),
                remarks='Daily rollcall'
            )

            # alex_kumar has 90% attendance
            Attendance.objects.create(
                batch=batch_cs,
                date=date,
                student=student_poor_acad,
                is_present=(random.random() < 0.90),
                remarks='Daily rollcall'
            )

        # 4. Exams & Results Seeding
        self.stdout.write('Seeding Exams and Results...')
        Exam.objects.all().delete()
        
        midterm = Exam.objects.create(
            course=cs_course,
            batch=batch_cs,
            name='Midterm Examination',
            date=today - datetime.timedelta(days=15),
            max_marks=100
        )
        
        finals = Exam.objects.create(
            course=cs_course,
            batch=batch_cs,
            name='Final Theory Examination',
            date=today - datetime.timedelta(days=2),
            max_marks=100
        )

        # john_doe (high performer)
        Result.objects.create(exam=midterm, student=student_high, marks_obtained=88, remarks='Excellent performance')
        Result.objects.create(exam=finals, student=student_high, marks_obtained=92, remarks='Outstanding result')

        # sarah_lee (decent performer)
        Result.objects.create(exam=midterm, student=student_low_att, marks_obtained=72, remarks='Good effort, needs attendance')
        Result.objects.create(exam=finals, student=student_low_att, marks_obtained=75, remarks='Satisfactory')

        # alex_kumar (poor performer - Risk Academic)
        Result.objects.create(exam=midterm, student=student_poor_acad, marks_obtained=38, remarks='Fail. Needs remediation')
        Result.objects.create(exam=finals, student=student_poor_acad, marks_obtained=35, remarks='Fail. Critical academic risk')

        # 5. Fees Seeding
        self.stdout.write('Seeding Fees...')
        Fee.objects.all().delete()
        
        # john_doe - paid all
        Fee.objects.create(student=student_high, description='Semester 5 Tuition Fee', amount=4500.00, due_date=today - datetime.timedelta(days=10), status='paid', payment_date=today - datetime.timedelta(days=12))
        Fee.objects.create(student=student_high, description='Library Deposit', amount=150.00, due_date=today + datetime.timedelta(days=30), status='paid', payment_date=today)

        # sarah_lee - pending but not overdue
        Fee.objects.create(student=student_low_att, description='Semester 5 Tuition Fee', amount=4500.00, due_date=today + datetime.timedelta(days=15), status='pending')

        # alex_kumar - overdue fee default
        Fee.objects.create(student=student_poor_acad, description='Semester 5 Tuition Fee', amount=4500.00, due_date=today - datetime.timedelta(days=5), status='overdue')

        # 6. Library Seeding
        self.stdout.write('Seeding Library books...')
        Book.objects.all().delete()
        book1 = Book.objects.create(title='Introduction to Algorithms', author='Cormen, Leiserson, Rivest', isbn='9780262033848', total_copies=5, available_copies=4)
        book2 = Book.objects.create(title='Clean Code', author='Robert C. Martin', isbn='9780132350884', total_copies=3, available_copies=3)
        book3 = Book.objects.create(title='Designing Data-Intensive Applications', author='Martin Kleppmann', isbn='9781449373320', total_copies=4, available_copies=3)

        # Borrow records
        BorrowRecord.objects.all().delete()
        # Active borrow (within due date)
        BorrowRecord.objects.create(
            book=book1,
            student=student_high,
            borrow_date=today - datetime.timedelta(days=5),
            due_date=today + datetime.timedelta(days=9),
            status='borrowed'
        )
        # Returned borrow
        BorrowRecord.objects.create(
            book=book2,
            student=student_low_att,
            borrow_date=today - datetime.timedelta(days=20),
            due_date=today - datetime.timedelta(days=6),
            return_date=today - datetime.timedelta(days=8),
            status='returned'
        )
        # Overdue borrow with fine
        overdue_record = BorrowRecord.objects.create(
            book=book3,
            student=student_poor_acad,
            borrow_date=today - datetime.timedelta(days=25),
            due_date=today - datetime.timedelta(days=11),
            status='overdue'
        )
        overdue_record.fine_amount = overdue_record.calculate_fine()
        overdue_record.save()

        # 7. Timetable Seeding
        self.stdout.write('Seeding Timetable Rooms and Slots...')
        Room.objects.all().delete()
        lab_a = Room.objects.create(name='CS Lab A', capacity=50)
        room_101 = Room.objects.create(name='Lecture Room 101', capacity=60)
        seminar_hall = Room.objects.create(name='Block B Seminar Hall', capacity=120)

        TimeSlot.objects.all().delete()
        slot1 = TimeSlot.objects.create(day_of_week=1, start_time=datetime.time(9, 0), end_time=datetime.time(10, 30)) # Mon 9-10:30
        slot2 = TimeSlot.objects.create(day_of_week=1, start_time=datetime.time(10, 45), end_time=datetime.time(12, 15)) # Mon 10:45-12:15
        slot3 = TimeSlot.objects.create(day_of_week=2, start_time=datetime.time(9, 0), end_time=datetime.time(10, 30)) # Tue 9-10:30
        slot4 = TimeSlot.objects.create(day_of_week=3, start_time=datetime.time(14, 0), end_time=datetime.time(15, 30)) # Wed 2-3:30

        Timetable.objects.all().delete()
        Timetable.objects.create(batch=batch_cs, course=cs_course, faculty=staff1, room=room_101, time_slot=slot1)
        Timetable.objects.create(batch=batch_cs, course=cs_course, faculty=staff2, room=lab_a, time_slot=slot2)
        Timetable.objects.create(batch=batch_cs, course=cs_course, faculty=staff1, room=seminar_hall, time_slot=slot3)
        Timetable.objects.create(batch=batch_it, course=it_course, faculty=staff2, room=room_101, time_slot=slot4)

        # 8. Placement Seeding
        self.stdout.write('Seeding Placement drives...')
        Company.objects.all().delete()
        google = Company.objects.create(name='Google Inc.', industry='Technology', website='https://google.com')
        microsoft = Company.objects.create(name='Microsoft Corp.', industry='Software', website='https://microsoft.com')

        JobDrive.objects.all().delete()
        gd_google = JobDrive.objects.create(company=google, role_name='Software Engineering Intern', package_lpa=25.00, drive_date=today + datetime.timedelta(days=12), status='active', description='Google Summer of Code and Direct Internship Program')
        gd_ms = JobDrive.objects.create(company=microsoft, role_name='Associate Software Engineer', package_lpa=18.50, drive_date=today - datetime.timedelta(days=4), status='completed', description='University Hiring program for CSE/IT students')

        PlacementApplication.objects.all().delete()
        # john doe is shortlisted for Google
        PlacementApplication.objects.create(job_drive=gd_google, student=student_high, status='shortlisted')
        # john doe is placed at Microsoft
        PlacementApplication.objects.create(job_drive=gd_ms, student=student_high, status='placed')
        # sarah lee is interviewed for Microsoft
        PlacementApplication.objects.create(job_drive=gd_ms, student=student_low_att, status='interviewed')
        # alex kumar applied for Microsoft but was rejected
        PlacementApplication.objects.create(job_drive=gd_ms, student=student_poor_acad, status='rejected')

        # 9. Events Seeding
        self.stdout.write('Seeding Events...')
        Event.objects.all().delete()
        ev1 = Event.objects.create(title='GenAI Developer Seminar', description='Explore modern LLM and agent frameworks.', event_type='seminar', date=timezone.now() + datetime.timedelta(days=5), location='Block B Auditorium', organizer='ACM Student Chapter', capacity=150)
        ev2 = Event.objects.create(title='Full-Stack React Workshop', description='Learn Vite, Tailwind v4 and React 19.', event_type='workshop', date=timezone.now() + datetime.timedelta(days=8), location='CS Lab B', organizer='CSE Department', capacity=40)
        
        # RSVPs
        ev1.registered_students.add(student_high, student_low_att)
        ev2.registered_students.add(student_high)

        # 10. Leaves Seeding
        self.stdout.write('Seeding Leave requests...')
        LeaveRequest.objects.all().delete()
        # Student sick leave approved
        LeaveRequest.objects.create(user=student_high, leave_type='sick', start_date=today - datetime.timedelta(days=10), end_date=today - datetime.timedelta(days=9), reason='Viral fever. Doctor prescribed bed rest.', status='approved', action_by=staff1, action_date=timezone.now() - datetime.timedelta(days=10))
        # Student casual leave pending
        LeaveRequest.objects.create(user=student_low_att, leave_type='casual', start_date=today + datetime.timedelta(days=3), end_date=today + datetime.timedelta(days=4), reason='Family function in hometown.', status='pending')
        # Staff annual leave approved by Admin
        LeaveRequest.objects.create(user=staff1, leave_type='annual', start_date=today + datetime.timedelta(days=20), end_date=today + datetime.timedelta(days=25), reason='Personal vacation.', status='approved', action_by=admin_user, action_date=timezone.now())

        # 11. Notifications Seeding
        self.stdout.write('Seeding Notifications...')
        Notification.objects.all().delete()
        Notification.objects.create(user=student_poor_acad, title='Overdue Fee Alert', message='Your Semester 5 Tuition Fee of $4500.00 is overdue. Please pay immediately.', notification_type='fee')
        Notification.objects.create(user=student_low_att, title='Low Attendance Warning', message='Your attendance in CSE-2026 is currently at 60.0%. A minimum of 75% is required.', notification_type='attendance')
        Notification.objects.create(user=student_high, title='Congratulations!', message='You have been placed at Microsoft Corp. with a CTC of 18.50 LPA!', notification_type='placement')

        # 12. Audit Logs Seeding
        self.stdout.write('Seeding Audit Logs...')
        AuditLog.objects.all().delete()
        AuditLog.objects.create(user=admin_user, action='login', details='Admin logged in from IP 192.168.1.5')
        AuditLog.objects.create(user=admin_user, action='fee_update', details='Created fee templates for CS students')
        AuditLog.objects.create(user=staff1, action='attendance_update', details='Marked attendance for CSE-2026 on 2026-06-02')

        self.stdout.write(self.style.SUCCESS('Successfully seeded database!'))
