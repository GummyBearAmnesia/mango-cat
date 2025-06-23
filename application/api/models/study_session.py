from django.db import models
import datetime
from .user import User
from .todo_list_user import List
from django.utils.timezone import now
import string
import random

''' 
This is the model for the study sessions/ rooms that users can join to study together
'''
class StudySession(models.Model):
    ''' User that initiates the study session '''
    createdBy = models.ForeignKey(User, on_delete = models.CASCADE, related_name = 'study_session')
    sessionName = models.CharField(max_length=255, blank=False)
    ''' This is the room code that other users can use to join this session/room '''
    roomCode = models.CharField(max_length=8, unique=True, blank=True) 
    startTime = models.DateTimeField(default=now)
    endTime = models.DateTimeField(null=True, blank=True)
    date = models.DateField(default=datetime.date.today)
    ''' The ToDo list associated with this session '''
    Task = models.ForeignKey(List, on_delete=models.CASCADE, null=True, blank=True)
    ''' Storing the users currently in the session '''
    participants = models.ManyToManyField(User, related_name='study_sessions', blank = True)
    

    def generate_room_code(self):
        """
        To generate a random 8-digit room code with uppercase letters and numbers 
        """
        characters = string.ascii_uppercase + string.digits
        return ''.join(random.choice(characters) for _ in range(8))


    def save(self, *args, **kwargs):
        """
        Override the save method and ensure that every room code is unique by 
        generating a random code and checking if it already exists in the database
        """
        if not self.roomCode:
            while True:
                    self.roomCode = self.generate_room_code()
                    if not StudySession.objects.filter(roomCode=self.roomCode).exists():
                        break 

            if not self.Task:
                todo_list = List.objects.create(
                    name="TaskTrack: Study Edition",
                    is_shared=True
                )
                self.Task = todo_list
        super().save(*args, **kwargs)   


    def __str__(self):
        return f"Study session {self.sessionName} was created by {self.createdBy} on {self.date}. It was initiated at {self.startTime} and terminated at {self.endTime}"



