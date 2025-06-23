from django.db import IntegrityError
from django.test import TestCase
from django.core.exceptions import ValidationError

from api.models.friend_request import Friends
from api.models.user import User
from api.models.choices import Status


class FriendsModelTestCase(TestCase):
    ''' Tests for the Friends model'''

    fixtures = [
        'api/tests/fixtures/default_user.json',
        'api/tests/fixtures/default_friends.json'
    ]
    
    def setUp(self) -> None:
        
        self.user1 = User.objects.get(pk=1)
        self.user2 = User.objects.get(pk=2)
        self.user3 = User.objects.get(pk=3)

        self.friendship_accepted  = Friends.objects.get(pk=1)
        self.friendship_rejected = Friends.objects.get(pk=2)
        self.friendship_pending_requested = Friends.objects.get(pk=3)
        self.friendship_pending_received = Friends.objects.get(pk=4)

    
    def test_valid_user(self):
        """Test to check if a valid user can be considered valid"""
        self._assert_user_is_valid(self.friendship_accepted )

    def test_friends_count(self):
        """Check if 4 users exist in the database"""
        self.assertEqual(Friends.objects.count(), 4)

    def test_status_cannot_be_blank(self):
        """Test to check if the status cannot be blank"""
        self.friendship_accepted .status = ''
        self._assert_user_is_invalid(self.friendship_accepted)

    def test_status_cannot_be_over_10_characters_long(self):
        """Test to check if the status cannot exceed 10 characters"""
        self.friendship_accepted .status = 'x' * 11
        self._assert_user_is_invalid(self.friendship_accepted)

    def _assert_user_save_invalid(self, friendship):
        with self.assertRaises(ValidationError):
            friendship.save()

    def test_invalid_requested_by(self):
        """ Test to check if the requested_by attribute is invalid """
        self.friendship_accepted.requested_by = self.user3
        #self.friendship_accepted.save()
        self._assert_user_save_invalid(self.friendship_accepted)
        #self._assert_user_is_invalid(self.friendship_accepted)

    def test_friends_should_be_unique(self):
        """Test that friendship between two users should be unique"""
        existing_friendship = Friends.objects.filter(user1=self.user1, user2=self.user2).first()
        
        duplicate_friendship = Friends(
            user1=self.user2,
            user2=self.user1,
            status=Status.ACCEPTED,
            created_at="2025-02-01T12:00:00Z",
            requested_by = self.user1
        )
        if existing_friendship:
            with self.assertRaises(IntegrityError):
                duplicate_friendship.save()

    def test_check_friends_exists(self):
        """Ensure a specific user exists in the database"""
        friends = Friends.get_friends_with_status(self.user1, Status.ACCEPTED)
        self.assertEqual(len(friends), 1)
        self.assertEqual(friends[0].user2, self.user2)

    def _assert_user_is_valid(self, friendship):
        friendship.full_clean()

    def _assert_user_is_invalid(self, friendship):
        with self.assertRaises(ValidationError):
            friendship.full_clean()
    
    def test_student_str(self):
        """Test the string representation of Friends."""

        self.assertEqual(f'Friendship between {self.user1.firstname} {self.user1.lastname} and {self.user2.firstname} {self.user2.lastname}', str(self.friendship_accepted ))

    def test_are_friends_with_accepted_status(self):
        """Test if the method correctly identifies friends with 'ACCEPTED' status"""
        self.assertTrue(Friends.are_friends(self.user1, self.user2))
        self.assertTrue(Friends.are_friends(self.user2, self.user1))

    def test_are_friends_with_pending_status(self):
        """Test if the method correctly identifies when users are not friends with 'PENDING' status"""
        self.assertFalse(Friends.are_friends(self.user2, self.user3))
        self.assertFalse(Friends.are_friends(self.user3, self.user2))

    def test_are_friends_with_rejected_status(self):
        """Test if the method correctly identifies when users are not friends with 'REJECTED' status"""
        self.assertFalse(Friends.are_friends(self.user1, self.user3))
        self.assertFalse(Friends.are_friends(self.user3, self.user1))

    def test_get_invitations_sent(self):
        """ Test if a pending friend request is created correctly  """
        self.assertEqual([self.friendship_pending_requested],
                     Friends.get_invitations_sent(self.user1))


    def test_get_invitations_received(self):
        """ Test if a friend request from another user is recieved correctly """
        self.assertEqual([self.friendship_pending_received],
                     Friends.get_invitations_received(self.user1))


    def test_get_all_friends(self):
        """ Test if method correctly lists all of a user's friends """
        all_friends = []
        all_friends.extend(Friends.objects.filter(user1=self.user1))
        all_friends.extend(Friends.objects.filter(user2=self.user1))
        all_friends = list(all_friends) 

        self.assertEqual(all_friends, list(Friends.get_all_friends(self.user1)))

    def test_update_status(self):
        """ Test if method to change a friendship status works correctly """
        self.assertEqual(self.friendship_rejected.status, Status.REJECTED)
        Friends.update_status(self.friendship_rejected.pk, Status.ACCEPTED)
        ''' Ensure data is refreshed fro database '''
        self.friendship_rejected.refresh_from_db() 
        self.assertEqual(self.friendship_rejected.status, Status.ACCEPTED)

    def test_invalid_update_status(self):
        with self.assertRaises(ValueError) as context:
            Friends.update_status(9999, Status.ACCEPTED)

        self.assertEqual(str(context.exception), "Friendship not found.")


    def test_get_friend(self):
        """ Test if the method to get a friend using the friendship id and the friend works correctly """
        self.assertEqual(Friends.get_friend(self.friendship_rejected.pk, self.user2), self.user3)
    
    def test_invalid_get_friend(self):
        """ Test if the method to retrieve a friend throws the correct error when input data is invalid """
        with self.assertRaises(ValueError) as context:
            Friends.get_friend(9999, self.user1)

        self.assertEqual(str(context.exception), "Friendship not found.")

    def test_delete_friend(self):
        """ Check if the method to change friendship status works as expected """
        Friends.delete_friend(self.friendship_pending_received.pk)
        self.assertNotIn(self.friendship_pending_received, Friends.objects.all())
        
        Friends.delete_friend(self.friendship_accepted.pk, user=self.user1)
        self.friendship_accepted.refresh_from_db()
        self.assertEqual(self.friendship_accepted.status, Status.PENDING)

    def test_invalid_delete_friend(self):
        """ Check if the method to change friendship status gives the correct error when given invalid input data """
        with self.assertRaises(ValueError) as context:
            Friends.delete_friend(9999)

        self.assertEqual(str(context.exception), "Friendship not found.")

