from django.db import models
from django.db.models import Q
from django.core.exceptions import ValidationError
from .choices import *

'''
Friends model represents a friendship between two users.
It ensures that each friendship is stored only once using a unique constraint
and enforces order to prevent duplicate entries (e.g., storing both (1,2) and (2,1)).
'''

class Friends(models.Model):
    user1 = models.ForeignKey(
        'User', on_delete=models.CASCADE, related_name="friendships_initiated")
    user2 = models.ForeignKey(
        'User', on_delete=models.CASCADE, related_name="friendships_received")
    ''' Storing whether the request has been accepted, rejected, or is still pending '''
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    ''' User that created the request '''
    requested_by = models.ForeignKey(
        'User', on_delete=models.CASCADE, related_name="requested_by")

    class Meta:
        ''' 
        Once a user is friends with another user, they should not be able to 
        send another friend request to the same user unless they have first been unfriended
        '''
        constraints = [
            models.UniqueConstraint(
                fields=['user1', 'user2'], name='unique_friendship')
        ]

    def save(self, *args, **kwargs):
        '''
        Ensure that user1 is always the smaller ID to maintain order.
        Also, ensure that requested_by is either user1 or user2.
        '''
        if self.user1_id > self.user2_id:
            self.user1_id, self.user2_id = self.user2_id, self.user1_id

        if self.requested_by not in [self.user1, self.user2]:
            raise ValidationError(
                "The requested_by field must be either user1 or user2.")

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Friendship between {self.user1.firstname} {self.user1.lastname} and {self.user2.firstname} {self.user2.lastname}"

    @staticmethod
    def are_friends(user_a, user_b):
        '''
        Check if two users are friends (only if status is 'Accepted').

        :param user_a: First user
        :param user_b: Second user
        :return: Boolean (True if they are friends, False otherwise)
        '''
        return Friends.objects.filter(
            (Q(user1=user_a, user2=user_b) | Q(user1=user_b, user2=user_a)) & Q(
                status=Status.ACCEPTED)
        ).exists()

    @staticmethod
    def get_friends_with_status(user, status):
        '''
        Get all friends of a user with a specific friendship status.

        :param user_1: The user whose friends we want to fetch
        :param status: The status of the friendship (Pending, Accepted, Rejected)
        :return: Queryset of Friends objects matching the criteria
        '''
        return Friends.objects.filter(
            (Q(user1=user) | Q(user2=user)) & Q(status=status)
        )

    @staticmethod
    def get_invitations_sent(user):
        ''' 
        Get all pending requests initiated by the user 
        '''
        all_friends = Friends.get_friends_with_status(user, Status.PENDING)
        return [request for request in all_friends if request.requested_by == user]

    @staticmethod
    def get_invitations_received(user):
        ''' 
        Get all pending request for the user from other users 
        '''
        all_friends = Friends.get_friends_with_status(user, Status.PENDING)
        return [request for request in all_friends if request.requested_by != user]

    @staticmethod
    def get_all_friends(user):
        ''' 
        Returns all current friends 
        '''
        requests = Friends.objects.all()
        return [request for request in requests if request.user1 == user or request.user2 == user]

    @staticmethod
    def update_status(friendsId, status):
        '''
        Update the status of a friendship.
        '''
        try:
            friendship = Friends.objects.get(pk=friendsId)
            friendship.status = status
            friendship.save()
        except Friends.DoesNotExist:
            raise ValueError("Friendship not found.")

    @staticmethod
    def get_friend(Id, current_user):
        ''' 
        Get a friend using the friendship ID
        '''
        try:
            request = Friends.objects.get(pk=Id)
            return request.user1 if request.user2==current_user else request.user2
        except Friends.DoesNotExist:
            raise ValueError("Friendship not found.")

    @staticmethod
    def delete_friend(friendsId, user=None):
        '''
        Update the status of a friendship.
        '''
        try:
            friendship = Friends.objects.get(pk=friendsId)
            if friendship.status == Status.PENDING:
                friendship.delete()
            else: 
                # status = ACCEPTED
                friendship.status = Status.PENDING
                friendship.requested_by = Friends.get_friend(friendsId, user)
                friendship.save()
        except Friends.DoesNotExist:
            raise ValueError("Friendship not found.")
