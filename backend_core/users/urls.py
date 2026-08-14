from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, LoginOrRegisterView, SendOTPView, VerifyOTPView, SendEmailOTPView, VerifyEmailOTPView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('login-or-register/', LoginOrRegisterView.as_view(), name='login_or_register'),
    path('send-otp/', SendOTPView.as_view(), name='send_otp'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify_otp'),
    path('send-email-otp/', SendEmailOTPView.as_view(), name='send_email_otp'),
    path('verify-email-otp/', VerifyEmailOTPView.as_view(), name='verify_email_otp'),
]
