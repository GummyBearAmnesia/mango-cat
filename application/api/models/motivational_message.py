from django.db import models

class MotivationalMessage(models.Model):
    ''' 
    The Motivational Message model only stores the motivational message in a CharField
    '''
    text = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.text
