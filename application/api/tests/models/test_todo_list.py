from django.forms import ValidationError
from django.test import TestCase, override_settings
from api.models.todo_list import Task
from api.models.todo_list_user import List
from datetime import date, timedelta

""" Creating Task Model Tests """

@override_settings(MIGRATION_MODULES={"api": None})
class toDoListModelTest(TestCase):

    fixtures = [
        'api/tests/fixtures/default_lists.json'
    ]


    """Creating test Task objects"""
    def setUp(self):
        self.list1 = List.objects.get(pk=1)
        self.list2 = List.objects.get(pk=2)

        self.todo = Task.objects.create(
            list = self.list1,
            title = "Test task",
            content = "This is Content of a to do list item.",
            is_completed = True
        )
        self.todo2 = Task.objects.create(
            list = self.list2,
            title = "Test task2",
            content = ""
        )

   

    def test_toDo_create(self):
        """ Testing whether the todo object has been created correctly """
        self.assertEqual(self.todo.list, self.list1)
        self.assertEqual(self.todo.title, "Test task")
        self.assertEqual(self.todo.content, "This is Content of a to do list item.")
        self.assertEqual(self.todo.is_completed, True)

   
    def test_blank_title_is_invalid(self):
        """ Testing whether a blank title is shown correctly as invalid """
        self.todo.title = ""
        with self.assertRaises(ValidationError):
            self.todo.full_clean()

    
    def test_overlong_title_is_invalid(self):
        """ Testing whether a title exceeding the max_length is correctly shown as invalid """
        self.todo.title = "x" * 256
        with self.assertRaises(ValidationError):
            self.todo.full_clean()

    
    def test_default_values_and_blank_content_is_valid(self):
        """ Testing whether default values and blank content is accepted in a Task object """
        try:
            self.todo2.full_clean()
        except ValidationError:
            self.fail("Default test todo should be deemed valid")

        self.assertFalse(self.todo2.is_completed, "should be set to False")

        try:
            self.todo2.full_clean()
        except ValidationError:
            self.fail("Content can be set empty")

   
    def test_boolean_field_invalid(self):
        """ Testing whether an invalid boolean field is correctly shown as invalid """
        with self.assertRaises(ValidationError):
            todo3 = Task.objects.create(title="Invalid Bool", is_completed="yes")
            todo3.full_clean()

    
    def test_auto_increment_list_id(self):
        """ Testing that after each object is created, the new Task object's list_id is incremented """
        self.assertEqual(self.todo2.list_id, self.todo.list_id + 1)

   
    def test_listId_is_unique(self):
        """ Testing is the list_id is unique for every todoList object """
        self.assertNotEqual(self.todo.list_id, self.todo2.list_id)

    
    def test_creation_date_is_valid(self):
        """ Testing if the creation_date is set to the date when the Task object was created """
        self.assertEqual(self.todo.creation_date, date.today())

    
    def test_creation_date_is_read_only(self):
        """ Testing if the creation_date is not amendable after the Task object has been created """
        original_date = self.todo.creation_date
        with self.assertRaises(ValidationError):
            self.todo.creation_date = original_date - timedelta(days=1)
            self.todo.save() 

    
    def test_creation_date_with_multiple_objects_is_valid(self):
        """
        Testing if another Task object is created on the same day, then it should have the same 
        creation_date as the previous Task object
        """
        todoLater = Task.objects.create(list = self.list1, title="Test task3")
        self.assertEqual(todoLater.creation_date, date.today())
        self.assertEqual(self.todo.creation_date, todoLater.creation_date)

   
    def test_str(self):
        """ Testing the string method, seeing if it outputs the correct expected message """
        expected_str = f'Test task has list_id {self.todo.list}'
        self.assertEqual(str(self.todo), expected_str)


