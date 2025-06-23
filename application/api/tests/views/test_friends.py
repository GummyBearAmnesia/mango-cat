from rest_framework.test import APIClient
from django.test import RequestFactory
from rest_framework import status
from rest_framework.test import APITestCase
from api.models import User,Friends, Status

"""
Tests for the Friends view class
"""

class FriendsViewTestCase(APITestCase):
    fixtures = ['api/tests/fixtures/default_user.json',
                'api/tests/fixtures/default_friends.json']

    def setUp(self):
        """ Set up data for testing using fixtures. """

        self.factory = RequestFactory()
        self.user = User.objects.get(username='@alice123')
        self.friends = Friends.objects.get(pk=1)

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)


    def test_get_lists_of_friends(self):
        """ Test if the API correctly returns a list of friends for an authenticated user """

        response = self.client.get('/api/get_friends/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = Friends.get_friends_with_status(self.user, Status.ACCEPTED)
        self.assertEqual(len(response.data), len(data))

        list_data = response.data[0]
        self.assertEqual(list_data['id'], 1)
        self.assertEqual(list_data['name'], 'Bob')
        self.assertEqual(list_data['surname'], 'Johnson')
        self.assertEqual(list_data['username'], '@bob456')


    def test_get_invitations_sent(self):
        """ Test if the API correctly returns a list of pending friend requests initiated by the user for an authenticated user """

        response = self.client.get('/api/get_made_requests/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        check_data = Friends.get_invitations_sent(self.user)
        self.assertEqual(len(response.data), len(check_data))

        list_data = response.data[0]
        self.assertEqual(list_data['id'], check_data[0].id)
        self.assertEqual(list_data['name'], check_data[0].user2.firstname)
        self.assertEqual(list_data['surname'], check_data[0].user2.lastname)
        self.assertEqual(list_data['username'], check_data[0].user2.username)


    def test_get_pending_friends(self):
        """ Test if the API correctly returns a list of pending friend requests for an authenticated user """

        response = self.client.get('/api/get_pending_friends/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        check_data = Friends.get_invitations_received(self.user)
        self.assertEqual(len(response.data), len(check_data))

        list_data = response.data[0]
        self.assertEqual(list_data['id'], check_data[0].id)
        self.assertEqual(list_data['name'], check_data[0].user2.firstname)
        self.assertEqual(list_data['surname'], check_data[0].user2.lastname)
        self.assertEqual(list_data['username'], check_data[0].user2.username)
        

    def test_get_find_friends(self):
        """
        Test if the API for finding a user in order to send a friend request using the first 3 
        letters of their name or username works as it should
        """

        query = 'joh'
        response = self.client.get(f'/api/find_friend/?q={query}')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        check_data = User.find_user(query)
        self.assertEqual(len(response.data), len(check_data))

        list_data = response.data[0]
        self.assertEqual(list_data['id'], check_data[0].id)
        self.assertEqual(list_data['name'], check_data[0].firstname)
        self.assertEqual(list_data['surname'], check_data[0].lastname)
        self.assertEqual(list_data['username'], check_data[0].username)


    def test_get_friend_profile(self):
        """
        Test if the API correctly returns the profile of a user using their user ID
        """

        response = self.client.get(f'/api/get_friend_profile/3/')

        friend = Friends.get_friend(3, self.user)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        list_data = response.data
        self.assertEqual(friend.id, list_data['id'])
        self.assertEqual(friend.firstname, list_data['name'])
        self.assertEqual(friend.lastname, list_data['surname'])
        self.assertEqual(friend.username, list_data['username'])


    def test_accept_friend(self):
        """
        Test if the API correctly returns the status of a friendship using user2's user ID
        """

        self.assertEqual(Friends.objects.get(pk=4).status, Status.PENDING)
        response = self.client.patch('/api/accept_friend/4/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Friends.objects.get(pk=4).status, Status.ACCEPTED)
    

    def test_delete_user(self):
        """
        Test if the API correctly returns the status of a friendship using user2's user ID
        """

        self.assertEqual(Friends.objects.get(pk=1).status, Status.ACCEPTED)
        response = self.client.delete('/api/reject_friend/1/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Friends.objects.get(pk=1).status, Status.PENDING)


    def test_create_friend_request(self):
        """
        Test if the API correctly creates a friend request
        """

        new_user = User.objects.create(
            firstname="TestFirstname1", 
            lastname="TestLastname1",
            email="email@exampl.com",
            username="@TestUsername", 
            description= "",
            password ="pbkdf2_sha256$260000$4BNvFuAWoTT1XVU8D6hCay$KqDCG+bHl8TwYcvA60SGhOMluAheVOnF1PMz0wClilc=",
            created_at= "2025-01-01T12:00:00Z",
            hours_studied = 76,
            streaks = 100,
            total_sessions = 30)
        new_user.save()
        self.assertEqual(Friends.are_friends(self.user, new_user), False)
        response = self.client.post(f'/api/create_friend_request/{new_user.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        pending_friends = Friends.get_friends_with_status(self.user, Status.PENDING)

        self.assertIn(
            new_user,
            [friend.user2 for friend in pending_friends if friend.user1 ==
                self.user and friend.status == Status.PENDING]
            )

    ''' TEST NOT COMPLETE???? '''
    def test_get_invalid_request(self):
        """
        Simulate an invalid action by sending a request with an unknown view name.
        """

        request = self.client.get('/api/pending_friends/')
