import logging
logging.basicConfig(level=logging.INFO, handlers=[logging.StreamHandler()])
from django.core.management.base import BaseCommand, CommandError
from api.models.motivational_message import MotivationalMessage
import random
from django.core.management import call_command
from api.models import Friends, Appointments, User, Status, Task, Permission, MotivationalMessage, Rewards, StudySession, SessionUser, List
import pytz
from faker import Faker
from django.utils.timezone import now, make_aware
from random import choice, randint, sample
from datetime import datetime, timedelta, date

'''
For a default users we can simply create a json file and upload the data (have a look on tests/fixtures) 
This data can be accessed and used for tests and seeder, which helps to avoid rewriting same code
If we have to use a faker, than simply add function and call in handle function after call_command()
'''

class Command(BaseCommand):

    FRIENDS_COUNT = 10
    USER_COUNT = 30
    REWARDS_COUNT = 10
    DEFAULT_PASSWORD = "Password123"
    TODOLIST_COUNT = 10
    LIST_COUNT = 2
    SESSION_COUNT = 5
    SESSION_USER_COUNT = 25

    def __init__(self):
        super().__init__()
        self.faker = Faker('en_GB')

    def handle(self, *args, **kwargs):
        '''Main entry point for the command'''
        print("Starting database seeding...")

        try:
            # Load initial data from fixture 
            call_command('loaddata', 'api/tests/fixtures/default_user.json')
            call_command('loaddata', 'api/tests/fixtures/default_friends.json')
            call_command('loaddata', 'api/tests/fixtures/default_lists.json')
            call_command('loaddata', 'api/tests/fixtures/default_permissions.json')
            call_command('loaddata', 'api/tests/fixtures/default_list_task.json')
        
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error while seeding database: {e}'))
        # Seed various data types
        self.seed_motivationalMessage()
        self.generating_users()

        # Create a specific test user
        User.objects.create_user(
            email = "testuser@email.com",
            firstname = "Test",
            lastname = "User",
            username = "TestUser1",
            password = "Password123",
            description = "This is a test user"
        )
        
        # Generate random relations to the data
        self.generate_random_friends()
        self.generate_random_Lists()
        self.generate_random_toDoLists()
        self.generate_toDoListUsers()
        self.generate_events()
        
    def generate_random_friends(self):
        '''Generate random friend relationships until we reach FRIENDS_COUNT'''
        friends_count = Friends.objects.count()
        while friends_count < self.FRIENDS_COUNT:
            print(f"Seeding friend {friends_count}/{self.FRIENDS_COUNT}", end='\r')
            self.generate_friends()
            friends_count = Friends.objects.count()
        print("Friends seeding complete.")

    def generate_friends(self):
        '''Create a single friend relationship between random users'''
        users = User.objects.all()
        statuses = [c[0] for c in Status.choices]
        created_at = "2025-02-01T12:00:00Z"

        # Select two different users
        user1 = choice(users)
        user2 = choice(users)
        status = choice(statuses)

        # Ensure we're not creating a self-friendship and they aren't already friends
        if not user1 == user2 and not Friends.are_friends(user1, user2):
            self.create_friends({
                'user1': user1,
                'user2': user2,
                'status': status,
                'created_at': created_at,
                'requested_by': user1
            })

    def create_friends(self, data):
        '''Create a friend relationship with the given data'''
        try:
            friends = Friends.objects.create(
                user1=data["user1"],
                user2=data["user2"],
                status=data["status"],
                created_at=data["created_at"],
                requested_by=data["requested_by"]
            )
            return friends
        except:
            pass # Handles duplicates or other errors


    def seed_motivationalMessage(self):
        ''' Seed the database with motivational messages'''
        messages = [
            "Believe in yourself and all that you are.",
            "Hard work beats talent when talent doesn’t work hard.",
            "You are capable of more than you know.",
            "Success is not final, failure is not fatal: It is the courage to continue that counts.",
            "Don't watch the clock; do what it does. Keep going.",
            "Difficulties in life are intended to make us better, not bitter.",
            "You don’t have to be great to start, but you have to start to be great.",
        ]

        # Create messages that dont already exist
        for msg in messages:
            MotivationalMessage.objects.get_or_create(text=msg)

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(messages)} motivational messages.'))


    def generating_users(self):
        ''' Generate the specified number of random users'''
        for x in range(self.USER_COUNT):
            print(f"Seeding user {x+1}/{self.USER_COUNT}", end='\r')
            self.generate_random_user()

    def try_create_user(self, data):
        ''' Attempt to create a user, handling any exceptions'''
        try:
            self.create_user(data)
        except Exception as e:
            print(f"Failed to create user: {e}")

    def create_user(self, data):
        ''' Create a user with the given data'''
        User.objects.create_user(firstname = data['firstName'], lastname = data['lastName'], email = data['email'], username = data['username'], password = self.DEFAULT_PASSWORD, hours_studied = data['hoursStudied'], last_study_date = data['lastStudyDate'], streaks = data['streaks'], description = data['description'], total_sessions = data['totalSessions'])

    def generate_random_user(self):
        ''' Generate random data for a new user'''
        firstName = self.faker.first_name()
        lastName = self.faker.last_name()
        email = self.create_email(firstName, lastName)
        username = self.create_username(firstName, lastName)
        hoursStudied = randint(0, 8760)     # Assuming that the hours Studied reset every year
        lastStudyDate = date.today() - timedelta(days=1)
        streaks = randint(0, 365)            # Assuming the streaks reset every year
        description = Faker().text(max_nb_chars=200)
        totalSessions = randint(1, 100)

        self.try_create_user({'firstName': firstName, 'lastName' : lastName, 'email': email, 'username': username, 'hoursStudied': hoursStudied,'lastStudyDate': lastStudyDate, 'streaks': streaks, 'description': description, 'totalSessions': totalSessions})

    def generating_rewards(self):
        ''' Generate random rewards (not currently called in handle())'''
        for x in range(self.REWARDS_COUNT):
            print(f"Seeding user {x+1}/{self.REWARDS_COUNT}", end='\r')
            self.generate_random_reward()

    def generate_random_reward(self):
        ''' Create a random reward assignment for a user'''
        user = choice(User.objects.all())
        reward_id = randint(1,8)# Choose from one of 8 possible rewards
        try:
            Rewards.objects.create(user = user, reward_number = reward_id)
        except Exception as e:
            print(f"Failed to create reward: {e}")

    def generate_random_toDoLists(self):
        ''' Generate random todo lists until we reach TODOLIST_COUNT'''
        toDoList_count = Task.objects.count()
        print(f"Initial ToDoList count: {toDoList_count}, Target: {self.TODOLIST_COUNT}")

        while toDoList_count < self.TODOLIST_COUNT:
            print(f"Seeding ToDoLists {toDoList_count}/{self.TODOLIST_COUNT}")
            self.generate_toDoLists()
            toDoList_count = Task.objects.count()
        
        print(f"Final ToDoList count: {toDoList_count}, Target: {self.TODOLIST_COUNT}")
        print("ToDoList seeding complete.")

    def generate_toDoLists(self):
        ''' Create a single todo list with random data'''
        titles = ['Finish cw1', 'catch with with week 2', 'Project Task: create a database']
        contents = ['complete week 2 and week3', 'ask TA for help', 'clone github repo', 'understand travelling salesman problem', '']

        list = choice(List.objects.all())
        title = choice(titles)
        content = choice(contents)
        is_completed = choice([True, False])
        #is_shared = choice([True, False])

        self.create_toDoLists({
            'list': list,
            'title':title,
            'content':content,
            'is_completed':is_completed,
            #'is_shared': is_shared
        })

    def create_toDoLists(self, data):
        ''' Create a todo list with given data'''
        try:
            toDoLists = Task.objects.create(
                list = data["list"],
                title = data["title"],
                content = data["content"],
                is_completed = data["is_completed"],
                #is_shared = data["is_shared"]
            )
            return toDoLists
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating ToDoList: {str(e)}'))

    def generate_random_Lists(self):
        ''' Generte random lists until we reach LIST_COUNT'''
        toDoList_count = List.objects.count()
        print(
            f"Initial List count: {toDoList_count}, Target: {self.LIST_COUNT}")

        while toDoList_count < self.LIST_COUNT:
            print(f"Seeding ToDoLists {toDoList_count}/{self.LIST_COUNT}")
            self.generate_Lists()
            toDoList_count = List.objects.count()

        print(
            f"Final List count: {toDoList_count}, Target: {self.LIST_COUNT}")
        print("List seeding complete.")
    
    def generate_Lists(self):
        '''Create a single list with random data'''
        titles = ['Finish cw1', 'catch with with week 2',
                  'Project Task: create a database']

        name = choice(titles)

        is_shared = choice([True, False])
        self.create_Lists({
            'name': name,
            'is_shared': is_shared
        })

    def create_Lists(self, data):
        ''' Create a list with the given data'''
        try:
            Lists = List.objects.create(
                name=data["name"],
                is_shared=data["is_shared"]
            )
            return Lists
        except Exception as e:
            self.stdout.write(self.style.ERROR(
                f'Error creating ToDoList: {str(e)}'))


    def generate_toDoListUsers(self):
        ''' Assign todo list to random user'''
        users = list(User.objects.all())
        toDoLists = list(List.objects.all())

        print(f"Starting to seed permissions for {len(toDoLists)} toDoLists and {len(users)} users.")

        for toDo in toDoLists:
            '''if toDo.is_shared:
                num_permissions = randint(2, len(users))
            else:
                num_permissions = 1'''
            
            selected_users = sample(users, 1)

            #print(f"{'Shared' if toDo.is_shared else 'Exclusive'} Task {toDo.list_id}: Assigning {num_permissions} permissions.")

            for user in selected_users:
                #print(f"Assigning {permission_type} permission to user {user.user_id} for Task {toDo.list_id}.")

                self.create_toDoListUser({
                    'user_id': user,
                    'list_id': toDo
                })
        print("toDoListUser seeding complete")

    def create_toDoListUser(self, data):
        '''  Create a permission relationship between user and list'''
        try:
            Permission.objects.create(
                user_id = data["user_id"],
                list_id = data["list_id"]
            )
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating ToDoListUser: {str(e)}'))
  
    def generate_events(self):
        ''' Generate random calendar events for all users'''
        Appointments.objects.all().delete()

        for user in User.objects.all():
            for i in range(5):  # Create 5 events per user
                naive_start_date = datetime.now() + timedelta(days=random.randint(1, 30))
                naive_end_date = naive_start_date + timedelta(hours=random.randint(1, 5))

                start_date = make_aware(naive_start_date)
                end_date = make_aware(naive_end_date)

                Appointments.objects.create(
                    user=user,
                    name="CLASS for STUDENTS",
                    start_date=start_date,
                    end_date=end_date,
                    comments=f"Sample comment for event {i + 1}",
                )
        self.stdout.write(self.style.SUCCESS('Successfully seeded events for all users.'))
        
    # Helper functions
    def create_username(self, first_name, last_name):
        ''' Generate a username from first and last name'''
        return '@' + first_name.lower() + last_name.lower()

    def create_email(self, first_name, last_name):
        ''' Generate an email from first and last name'''
        return first_name.lower() + '.' + last_name.lower() + '@example.org'
