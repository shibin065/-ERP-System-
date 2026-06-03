from django.urls import path
from .views import AIChatbotView, AIStudentRiskPredictorView

urlpatterns = [
    path('chatbot/', AIChatbotView.as_view(), name='ai_chatbot'),
    path('risk-predictor/', AIStudentRiskPredictorView.as_view(), name='ai_risk_predictor'),
]
