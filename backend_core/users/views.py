from django.contrib.auth.models import User
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserSerializer

class LoginOrRegisterView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email', '')
        is_social = request.data.get('is_social', False)

        if not username or not password:
            return Response({"detail": "Username and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Look up existing user by username or email
        user = None
        if User.objects.filter(username=username).exists():
            user = User.objects.get(username=username)
        elif email and User.objects.filter(email=email).exists():
            user = User.objects.filter(email=email).first()

        if user:
            # User exists. If Google/Social Login, log in directly since Google verified them
            if is_social:
                refresh = RefreshToken.for_user(user)
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }, status=status.HTTP_200_OK)

            # Standard credential verification
            authenticated_user = authenticate(username=user.username, password=password)
            if authenticated_user:
                refresh = RefreshToken.for_user(authenticated_user)
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }, status=status.HTTP_200_OK)
            else:
                return Response({"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)
        else:
            # User doesn't exist, register them
            try:
                user_email = email if email else (username if '@' in username else '')
                new_user = User.objects.create_user(
                    username=username,
                    email=user_email,
                    password=password
                )
                refresh = RefreshToken.for_user(new_user)
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

import random
from django.core.cache import cache
import os

class SendOTPView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        phone = request.data.get('phone')
        if not phone:
            return Response({'error': 'Phone number is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Bypass for all phones: Static OTP
        otp = '123456'
        
        # Store in cache for 5 minutes
        cache.set(f"otp_{phone}", otp, timeout=300)
        
        # Mock mode print
        print(f"\n{'='*40}\n[MOCK SMS] To: {phone}\nOTP: {otp} (Bypassed)\n{'='*40}\n")
            
        return Response({'message': 'OTP sent successfully.'}, status=status.HTTP_200_OK)


class VerifyOTPView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        phone = request.data.get('phone')
        otp = request.data.get('otp')
        
        if not phone or not otp:
            return Response({'error': 'Phone and OTP are required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Bypass validation entirely: any OTP is accepted
        # cached_otp = cache.get(f"otp_{phone}")
        # if not cached_otp or cached_otp != otp:
        #     return Response({'error': 'Invalid or expired OTP.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # OTP is valid, clear it
        cache.delete(f"otp_{phone}")
        
        # Look up or create user based on phone
        username = f"phone_{phone}"
        user = None
        if User.objects.filter(username=username).exists():
            user = User.objects.get(username=username)
        else:
            dummy_email = f"{phone}@cineverse.dummy"
            user = User.objects.create_user(
                username=username,
                email=dummy_email,
                password=f"PhoneAuth_{phone}"
            )
            
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_200_OK)

from django.core.mail import send_mail
from django.conf import settings

class SendEmailOTPView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Bypass for all emails: Static OTP
        otp = '123456'
        cache.set(f"email_otp_{email}", otp, timeout=300)
        
        # Mock mode print
        print(f"\n{'='*40}\n[MOCK EMAIL] To: {email}\nOTP: {otp} (Bypassed)\n{'='*40}\n")
            
        return Response({'message': 'Email OTP sent successfully.'}, status=status.HTTP_200_OK)

class VerifyEmailOTPView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        
        if not email or not otp:
            return Response({'error': 'Email and OTP are required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Bypass validation entirely: any OTP is accepted
        # cached_otp = cache.get(f"email_otp_{email}")
        # if not cached_otp or cached_otp != otp:
        #     return Response({'error': 'Invalid or expired OTP.'}, status=status.HTTP_400_BAD_REQUEST)
            
        cache.delete(f"email_otp_{email}")
        
        user = None
        if User.objects.filter(email=email).exists():
            user = User.objects.filter(email=email).first()
        else:
            username = email.split('@')[0] + str(random.randint(1000, 9999))
            user = User.objects.create_user(
                username=username,
                email=email,
                password=f"EmailAuth_{email}"
            )
            
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_200_OK)
