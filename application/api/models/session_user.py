from django.db import models
from django.utils.timezone import now
import datetime
from .user import User
from .study_session import StudySession
from django.db import connection

"""
    Represents a user's participation in a study session, tracking a range of session-specific information.
"""

class SessionUser(models.Model):
    ''' Foreign keys from other models to store which user is in which session '''
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='session_users')
    session = models.ForeignKey(StudySession, on_delete=models.CASCADE, related_name='session_users')
    join_sequence = models.PositiveIntegerField(default=1)
   
    ''' Tracking when the user joined and left the session '''
    joined_at = models.DateTimeField(default=now)
    left_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ''' Sort by newest sessions '''
        ordering = ['session']

    def __str__(self):
        return f"{self.user.username} - {self.session.sessionName}"

    def leave_session(self):
        """
        Calculate total session time, update user's study statistics, and remove session entry.
        """
        # Calculate total session time
        if self.left_at is None:
            self.left_at = now()

        session_duration = self.left_at - self.joined_at
        hours_studied = session_duration.total_seconds() / 3600  # Convert to hours

        # Update user's total study statistics
        if hours_studied > 0:
            self.user.hours_studied += int(hours_studied)
            self.user.total_sessions += 1  # Increment total sessions
            self.user.save()

        # Delete the session user entry
        self.delete()

    @classmethod
    def rejoin_session(cls, user, session):
        """
        Creates a new SessionUser entry for a user rejoining a session.
        First ensures any existing session entry is properly closed out.
        Increments the join_sequence field based on previous joins.
        """
        # Close any existing active sessions
        for existing_session in cls.objects.filter(user=user, left_at__isnull=True):
            existing_session.leave_session()
        
        # Get next sequence number by counting ALL previous joins (including left sessions)
        next_sequence = cls.objects.filter(
            user=user, 
            session=session
        ).count() + 1

        # Add user to participants if not already
        if user not in session.participants.all():
            session.participants.add(user)
            session.save()

        # Create and return new session
        return cls.objects.create(
            user=user,
            session=session,
            join_sequence=next_sequence
        )

