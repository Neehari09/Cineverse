from django.db import models
from django.contrib.auth.models import User

class Booking(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    
    # Movie Details
    tmdb_movie_id = models.IntegerField()
    movie_title = models.CharField(max_length=255)
    movie_poster = models.CharField(max_length=255, null=True, blank=True)
    
    # Booking Details
    cinema = models.CharField(max_length=255)
    show_date = models.DateTimeField()
    show_time = models.CharField(max_length=50)
    format = models.CharField(max_length=50)
    
    # Seats and Payment
    seat_numbers = models.CharField(max_length=255) # Comma-separated like "A1,A2"
    amount = models.IntegerField()
    booking_code = models.CharField(max_length=50)
    status = models.CharField(max_length=50, default='upcoming') # upcoming, past, cancelled

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'booking'

    def __str__(self):
        return f"{self.user.username} - {self.movie_title} - {self.booking_code}"
