from django.db import models

'''
This class is being used in the Friends feature (both in the model and the view function)
to keep track of which friend requests have been accepted, which have been rejected, and 
which are still pending.
'''

class Status(models.TextChoices):
    PENDING = 'Pending', 'Pending'
    ACCEPTED = 'Accepted', 'Accepted'
    REJECTED = 'Rejected', 'Rejected'