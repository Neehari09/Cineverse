from django.contrib import admin
from .models import Booking

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('user', 'movie_title', 'cinema', 'show_date', 'status')
    search_fields = ('movie_title', 'booking_code', 'user__username')
    list_filter = ('status', 'cinema')
