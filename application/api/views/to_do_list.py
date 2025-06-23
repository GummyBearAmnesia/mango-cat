from django.contrib.auth.mixins import LoginRequiredMixin
from api.models import List, Task, Permission
from rest_framework.decorators import api_view
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.views import View
from rest_framework.permissions import IsAuthenticated
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from api.models import StudySession

class ViewToDoList(APIView):
    '''
    API view for manageing to-do-lists and it's tasks. Required Authentication.
    '''
    permission_classes = [IsAuthenticated]

    def get(self, request, id=0):
        '''
        Retrieve to-do-lists and task for the user or a specific group lists.
        '''
        user = request.user
        url_name = request.resolver_match.view_name

        if url_name == "group_to_do_list":
            # Fetch a specific group to-do list
            user_lists = List.objects.filter(pk=id)
        else:
            # Fetch all personal to-do-lists for the user
            user_permissions = Permission.objects.filter(user_id=user)
            user_lists = List.objects.filter(
                id__in=user_permissions.values_list('list_id', flat=True),
                is_shared=False
                )

        # Format the response data
        response_data = []
        for todo_list in user_lists:
            tasks = Task.objects.filter(list=todo_list)
            response_data.append({
                "id": todo_list.pk,
                "name": todo_list.name,
                "is_shared": todo_list.is_shared,
                "tasks": [
                    {
                        "id": task.pk,
                        "title": task.title,
                        "content": task.content,
                        "is_completed": task.is_completed,
                        "creation_date": task.creation_date
                    }
                    for task in tasks
                ]
            })
        return Response(response_data, status=status.HTTP_200_OK)

    def post(self, request):
        '''
        Handle POST requests to create a new task or to-do-list
        '''

        url_name = request.resolver_match.view_name

        if url_name == "create_new_task":
            return self.create_task(request)
        elif url_name == "create_new_list":
            return self.create_list(request)
        return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, id = None):
        '''
        Handle DELETE requests to delete the tasks or to-do-list.
        '''
        url_name = request.resolver_match.view_name
        if url_name == "delete_task":
            return self.delete_task(request, id)
        elif url_name == "delete_list":
            return self.delete_list(request, id)
        return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)

    def delete_task(self, request, task_id):
        """
        Delete a specific task and notify WebSocket participants if the list is shared.
        """
        try:
            if Task.objects.filter(pk=task_id).exists():
                task = Task.objects.get(id=task_id)

                # Notify particpants if the list is shared
                if task.list.is_shared:
                    try:
                        study_session = StudySession.objects.get(Task=task.list)  # ✅ Fix: Use correct variable
                        room_code = study_session.roomCode  # Get the correct room code
                    except StudySession.DoesNotExist:
                        return Response({"error": "No study session found for this list"}, status=status.HTTP_400_BAD_REQUEST)

                    channel_layer = get_channel_layer()
                    async_to_sync(channel_layer.group_send)(
                        f"room_{room_code}",
                        {
                            "type": "remove_task",
                            "task_id": task_id,
                        }
                    )
                Task.objects.get(pk=task_id).delete()
                return Response({"data": task_id}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Task doesn't exist"}, status=status.HTTP_400_BAD_REQUEST)           
        except Exception as e:
            return Response({"error": "Invalid request", "details": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete_list(self, request, list_id):
        '''
        Delete a to-do-list and all associated data
        '''
        try:
            if List.objects.filter(pk=list_id).exists():
                Task.objects.filter(list=list_id).delete()
                Permission.objects.filter(list_id = list_id).delete()
                List.objects.get(pk=list_id).delete()
                return self.get(request)
            else:
                return Response({"error": "Task doesn't exist"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": "Invalid request", "details": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def create_task(self, request):
        '''
        Create a new task and notify all participants if the list is shared
        '''
        try:
            data = request.data
            title = data.get("title")
            list_id = data.get("list_id")
            content = data.get("content")

            if List.objects.filter(pk=list_id).exists():
                list_obj = List.objects.get(pk=list_id)
                task = Task.objects.create(
                    title=title, content=content, list=list_obj
                )
                task.save()

                # Send WebSocket update if the list is shared
                if task.list.is_shared:
                    try:
                        study_session = StudySession.objects.get(Task=list_obj)  
                        room_code = study_session.roomCode  # Get the correct room code
                    except StudySession.DoesNotExist:
                        return Response({"error": "No study session found for this list"}, status=status.HTTP_400_BAD_REQUEST)

                    # Now send WebSocket message using room_code
                    channel_layer = get_channel_layer() 
                    async_to_sync(channel_layer.group_send)(
                        f"room_{room_code}",
                        {
                            "type": "add_task",
                            "task": {
                                "id": task.pk,
                                "title": task.title,
                                "content": task.content,
                                "is_completed": task.is_completed,
                                "list_id": task.list.pk,
                            },
                        }
                    )
                response_data = {
                    "listId": task.list.pk,
                    "id": task.pk,
                    "title": task.title,
                    "content": task.content,
                    "is_completed": task.is_completed,
                }
                return Response(response_data, status=status.HTTP_200_OK)

            else:
                return Response({"error": "List doesn't exist"}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"error": "Invalid request", "details": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def create_list(self, request):
        '''
        Create a new to-do-list and assign permissions to the authenticated user.
        '''
        try:
            user = request.user
            data = request.data
            name = data.get("name")
            is_shared = data.get("is_shared")

            list = List.objects.create(
                name=name, is_shared=is_shared)
            list.save()

            permission = Permission.objects.create(list_id=list, user_id=user)
            permission.save()
            
            response_data = {
                "listId": list.pk,
                "name": list.name,
                "isShared": list.is_shared,
            }
            return Response(response_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": "Invalid request", "details": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, task_id):
        '''
        Toggle the completion status of a task and notify participants if the list is shared
        '''
        try:
            # This line throws DoesNotExist if not found
            task = Task.objects.get(pk=task_id)
            new_task_status = not task.is_completed
            task.is_completed = new_task_status
            task.save()

            # Sends WebSocket Update
            if task.list.is_shared:
                try:
                    study_session = StudySession.objects.get(Task=task.list)
                    room_code = study_session.roomCode  # Get the correct room code
                except StudySession.DoesNotExist:
                    return Response({"error": "No study session found for this list"}, status=status.HTTP_400_BAD_REQUEST)

                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f"room_{room_code}",
                    {
                        "type": "toggle_task",
                        "task_id": task_id,
                        "is_completed": task.is_completed,
                    }
                )

            return Response({"is_completed": task.is_completed}, status=status.HTTP_200_OK)
        except Task.DoesNotExist:  # Catch the specific exception
            return Response({"error": "Task not found"}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"error": "Invalid request", "details": str(e)}, status=status.HTTP_400_BAD_REQUEST)
