from django.db import models
from .user import User

'''
This is the model for handling rewards for users based on their study sessions.

Primary key : reward_id (instance of reward given to the user)
Foreign key : user_id
Other fields : date_earned, reward_id

'reward_number' will link to the FK reward_id firebase database.
In firebase there should be an image/badge for the corresponding reward_number, and a reward_name.
'''

class Rewards (models.Model):
    '''' Unique instance of the reward as PK '''
    reward_id = models.AutoField(primary_key=True)
    ''' Link to the user '''
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    ''' FK links to Firebase reward_id '''    
    reward_number = models.IntegerField() 
    ''' Adds the timestamp for when the reward was earned '''
    date_earned = models.DateTimeField(auto_now_add=True) 

    def __str__(self):
        return f"{self.user.username} - Reward {self.reward_number}"