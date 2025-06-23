from django.db import models
from .user import User

"""
Both classes (List and Permission) are used with the Task model
"""

class List(models.Model):

    name = models.CharField(max_length=255)  
    is_shared = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.pk}"


"""
Used to check which to do lists are available to each user
"""
class Permission(models.Model):

    user_id = models.ForeignKey(User, on_delete=models.CASCADE)  
    list_id = models.ForeignKey(List, on_delete=models.CASCADE)

    class Meta:
        ''' Ensuring a user cannot have duplicate permissions for the same list '''
        unique_together = ('user_id', 'list_id') 

    def __str__(self):
        return f"{self.user_id} - {self.list_id}"