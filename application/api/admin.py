from django.contrib import admin
from .models.events import Appointments

# Enable Appointments model in admin dashboard
admin.site.register(Appointments)