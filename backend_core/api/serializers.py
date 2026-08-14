from rest_framework import serializers
from .models import Booking
class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = (
            'id', 'tmdb_movie_id', 'movie_title', 'movie_poster', 
            'cinema', 'show_date', 'show_time', 'format', 
            'seat_numbers', 'amount', 'booking_code', 'status', 'created_at'
        )
