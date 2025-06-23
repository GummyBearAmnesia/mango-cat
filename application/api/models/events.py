from django.db import models
from .user import User

'''
This is model for the events that can be added on the calendar
'''

class Appointments(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True)    
    ''' Name of the event ''' 
    name = models.CharField(max_length= 200)    
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    ''' Description of the event '''
    comments = models.CharField(max_length= 500, blank=True, null=True)   

    def __str__(self):
        return self.name