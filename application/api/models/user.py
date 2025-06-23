from django.db import models
from django.contrib.auth.models import BaseUserManager, AbstractBaseUser, PermissionsMixin
from django.core.validators import RegexValidator
from django.db.models import Q
from datetime import timedelta
from django.utils.timezone import now

'''
Custom User Model & Manager. Extends AbstractBaseUser to create custom User model

Primary key     :   user_id (Auto-incremented)
Required fields :   firstname, lastname, email, username, password, description
'''

class UserManager(BaseUserManager):
      """
      Custom User Manager to handle user creation
      """
      def create_user(self, email, firstname, lastname, username, password, description, **extra_fields):
            """
            Create and save a user
            """
            if not email:
                raise ValueError(("The Email must be set"))
            if not username:
                raise ValueError("Users must have a username")
            if not firstname:
                raise ValueError("Firstname must be set")
            if not lastname:
                raise ValueError("Lastname must be set")
            if not password:
                raise ValueError("Password must be set")
            
            ''' Normalises email by lowercasing the domain part '''
            email = self.normalize_email(email) 
            user = self.model(email=email, username=username, firstname=firstname, lastname=lastname, description=description, **extra_fields)
            ''' Automatically hashes password before saving '''
            user.set_password(password)         
            user.save(using=self._db)
            return user
    

class User(AbstractBaseUser, PermissionsMixin):
    firstname = models.CharField(max_length=50, blank=False)
    lastname = models.CharField(max_length=50, blank=False)
    email = models.EmailField(max_length=100, unique=True, blank=False)
    username = models.CharField(max_length=30,
        unique=True,
        validators=[RegexValidator(
            regex=r'^@\w{3,}$',
            message='Username must consist of @ followed by at least three alphanumericals'
        )])
    created_at = models.DateTimeField(auto_now_add=True)
    hours_studied = models.IntegerField(default=0)
    last_study_date = models.DateField(null=True, blank=True)   # Last recorded study date - used for analytics
    streaks = models.IntegerField(default=0)
    share_analytics = models.BooleanField(default=False)
    ''' description can be left blank '''
    description = models.TextField(blank=True, default="") 
    total_sessions = models.IntegerField(default=0)
    
    ''' Uses UserManager as custom manager '''
    objects = UserManager()

    ''' Uses email instead of username for authentication i.e. for login '''
    USERNAME_FIELD = 'email'    
    REQUIRED_FIELDS = ['firstname', 'lastname', 'username']

    def __str__(self):
        return self.username
    
    def full_name(self):
        """Return a string containing the user's full name."""
        return f'{self.firstname} {self.lastname}'

    @staticmethod
    def find_user(search_query):
        """
        This function is used in the friends view class to find a user in the 
        database using their first name, last name, or username
        """
        return User.objects.filter(
            Q(username__icontains=search_query) |
            Q(firstname__icontains=search_query) |
            Q(lastname__icontains=search_query))
    
    def update_study_streak(self):
        today = now().date()

        if self.last_study_date == today:
            # User already studied today, no need to update
            return

        if self.last_study_date == today - timedelta(days=1):
            # Studied yesterday, increase streak
            self.streaks += 1
        else:
            # Missed a day, reset streak
            self.streaks = 1

        self.last_study_date = today
        self.save()
        
