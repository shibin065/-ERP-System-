import os
import json
import urllib.request
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.db.models import Avg
from attendance.models import Attendance
from fees.models import Fee
from exams.models import Exam, Result
from timetable.models import Timetable
from placement.models import PlacementApplication

User = get_user_model()

class AIChatbotView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        user = request.user
        message = request.data.get('message', '').lower().strip()

        if not message:
            return Response({"error": "Message is required."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Gather DB Context for the User
        # Calculate attendance percentage
        total_att = Attendance.objects.filter(student=user).count()
        present_att = Attendance.objects.filter(student=user, is_present=True).count()
        att_rate = (present_att / total_att * 100) if total_att > 0 else 0.0

        # Fees
        fees = Fee.objects.filter(student=user)
        pending_fees = fees.filter(status__in=['pending', 'overdue'])
        total_pending = sum([f.amount for f in pending_fees])

        # Exams and Results
        results = Result.objects.filter(student=user)
        avg_marks = results.aggregate(Avg('marks_obtained'))['marks_obtained__avg'] or 0.0

        # Classes/Timetable
        classes = Timetable.objects.filter(batch__students=user) if user.role == 'student' else Timetable.objects.filter(faculty=user)
        
        # Build contextual prompt
        context_str = (
            f"User details:\n"
            f"- Username: {user.username}\n"
            f"- Role: {user.role}\n"
            f"- Attendance Rate: {att_rate:.1f}% ({present_att}/{total_att} present)\n"
            f"- Outstanding Fees: ${total_pending:.2f} across {pending_fees.count()} pending/overdue bills\n"
            f"- Academic Performance: Average mark is {avg_marks:.1f}%\n"
            f"- Scheduled Classes: {classes.count()} classes on record\n"
        )

        api_key = os.environ.get('OPENAI_API_KEY', '')

        # If API key is present, invoke OpenAI
        if api_key:
            try:
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}"
                }
                payload = {
                    "model": "gpt-4o-mini",
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "You are a helpful and intelligent Smart Campus AI Assistant. "
                                "You have access to the user's live profile details from the college database. "
                                "Answer their query concisely and professionally using the context below. "
                                "Never mention that you got the context from a system prompt. "
                                "Context:\n" + context_str
                            )
                        },
                        {"role": "user", "content": message}
                    ],
                    "temperature": 0.5,
                    "max_tokens": 200
                }
                
                req = urllib.request.Request(
                    "https://api.openai.com/v1/chat/completions",
                    data=json.dumps(payload).encode('utf-8'),
                    headers=headers,
                    method='POST'
                )
                with urllib.request.urlopen(req, timeout=10) as response:
                    res_data = json.loads(response.read().decode('utf-8'))
                    ai_reply = res_data['choices'][0]['message']['content'].strip()
                    return Response({"reply": ai_reply, "mode": "openai"}, status=status.HTTP_200_OK)
            except Exception as e:
                # Log error and fallback
                pass

        # 2. Local Fallback Rule Engine
        reply = ""
        if "attendance" in message:
            reply = f"Hello {user.username}! Your current attendance rate is **{att_rate:.1f}%**. You were present for **{present_att}** out of **{total_att}** recorded class days."
            if att_rate < 75.0:
                reply += " ⚠️ **Warning:** Your attendance is below the minimum threshold of **75%**. Please attend classes regularly to avoid exam eligibility issues."
            else:
                reply += " Great job keeping up your attendance!"
        elif "fee" in message or "pay" in message or "bill" in message:
            if total_pending > 0:
                fee_details = ", ".join([f"{f.description} (${f.amount:.2f} - Due: {f.due_date})" for f in pending_fees])
                reply = f"You have **{pending_fees.count()}** unpaid fee invoices totaling **${total_pending:.2f}**. Details: {fee_details}. Please make payments via the Fees portal."
            else:
                reply = f"Good news! You have no pending fees. Your account is fully paid up."
        elif "exam" in message or "result" in message or "grade" in message or "marks" in message:
            if results.exists():
                res_details = ", ".join([f"{r.exam.name}: {r.marks_obtained}%" for r in results])
                reply = f"Here are your latest academic grades: {res_details}. Your current overall average is **{avg_marks:.1f}%**."
                if avg_marks < 50.0:
                    reply += " ⚠️ Your average is below 50%. We recommend scheduling a mentoring session with your course advisor."
            else:
                reply = "No examination results are currently published on your profile."
        elif "timetable" in message or "class" in message or "schedule" in message:
            if classes.exists():
                class_details = ", ".join([f"{c.course.name} with {c.faculty.username} in {c.room.name} ({c.time_slot})" for c in classes])
                reply = f"Here is your timetable schedule: {class_details}."
            else:
                reply = "No classes are registered on your timetable."
        else:
            reply = (
                f"Hello, {user.username}! I am your Smart Campus AI assistant. "
                f"Ask me about your attendance, fees, exams, or class schedule!\n\n"
                f"For example, you can try: **'What is my attendance?'**, **'Show my fee status'**, or **'Do I have classes?'**"
            )

        return Response({"reply": reply, "mode": "local_fallback"}, status=status.HTTP_200_OK)


class AIStudentRiskPredictorView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        user = request.user
        
        # If user is student, return risk profile for their own account
        if user.role == 'student':
            risk_profile = self.get_student_risk_profile(user)
            return Response(risk_profile, status=status.HTTP_200_OK)

        # Staff or Admin: calculate risk for all students
        students = User.objects.filter(role='student')
        student_risks = []
        for s in students:
            profile = self.get_student_risk_profile(s)
            student_risks.append(profile)

        # Sort: High risk first, then Medium, then Low
        severity = {'high': 3, 'medium': 2, 'low': 1}
        student_risks.sort(key=lambda x: severity[x['risk_level']], reverse=True)

        return Response(student_risks, status=status.HTTP_200_OK)

    def get_student_risk_profile(self, student):
        # Calculate attendance percentage
        total_att = Attendance.objects.filter(student=student).count()
        present_att = Attendance.objects.filter(student=student, is_present=True).count()
        att_rate = (present_att / total_att * 100) if total_att > 0 else 100.0

        # Academic average
        avg_marks = Result.objects.filter(student=student).aggregate(Avg('marks_obtained'))['marks_obtained__avg'] or 0.0

        # Outstanding fees overdue
        has_overdue_fees = Fee.objects.filter(student=student, status='overdue').exists()

        # Compile risk factors
        factors = []
        if att_rate < 75.0:
            factors.append("Low attendance (< 75%)")
        if avg_marks < 50.0 and Result.objects.filter(student=student).exists():
            factors.append("Poor academic performance (< 50% avg)")
        if has_overdue_fees:
            factors.append("Fee default (overdue balances)")

        # Risk Level
        risk_level = 'low'
        if len(factors) >= 2:
            risk_level = 'high'
        elif len(factors) == 1:
            risk_level = 'medium'

        # Recommendation
        recommendations = []
        if att_rate < 75.0:
            recommendations.append("Mandatory attendance counselling session.")
        if avg_marks < 50.0 and Result.objects.filter(student=student).exists():
            recommendations.append("Assign to academic remediation class.")
        if has_overdue_fees:
            recommendations.append("Issue finance fee due alert.")
        
        if not recommendations:
            recommendations.append("No action required. Student is on track.")

        # Batch
        batch_name = "N/A"
        if student.batches.exists():
            batch_name = student.batches.first().name

        return {
            "student_id": student.id,
            "student_name": student.username,
            "email": student.email,
            "batch": batch_name,
            "attendance_rate": round(att_rate, 1),
            "academic_avg": round(avg_marks, 1),
            "has_overdue_fees": has_overdue_fees,
            "risk_level": risk_level,
            "risk_factors": factors,
            "recommendations": recommendations
        }
