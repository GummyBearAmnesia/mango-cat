from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from api.views import *
from api import views
from api.views.profile_view import get_logged_in_user, save_description, get_user_badges
from api.views.analytics import get_analytics, update_analytics
from api.views.groupStudyRoom import create_room, join_room
from api.views.calendar import EventViewSet
from api.views.shared_materials_view import get_current_session

# Event ViewSet endpoints configuration
from api.views.spotify_view import AuthURL, spotify_callback, IsAuthenticated
event_list = EventViewSet.as_view({'get': 'list', 'post': 'create'})
event_detail = EventViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'})

# Initialize DefaultRouter for REST framework endpoints
router = DefaultRouter()
router.register(r'events', EventViewSet, basename='event')

urlpatterns = [
    # Admin interface
    path('admin/', admin.site.urls),

    # API endpoints from api/urls.py
    path('api/', include('api.urls')),

    # Frontend entry point
    path('', TemplateView.as_view(template_name='index.html')),
    
    # Authentication endpoints
    path('api/signup/', views.SignUpView.as_view(), name='signup'),
    path('api/login/', views.login, name='login'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Analytics endpoints
    path("api/analytics/", get_analytics, name="analytics"),
    path("api/share_analytics/", update_analytics, name="update_analytics"),

    #Study Room endpoints
    path('api/create-room/', create_room),
    path('api/join-room/', join_room),
    path('api/get-room-details/', get_room_details),
    path('api/get-participants/', get_participants),
    path('api/leave-room/', leave_room),

    #todo list endpoint
    path('api/todolists/', views.ViewToDoList.as_view(), name='to_do_list'),
    path('api/todolists/<int:id>/', views.ViewToDoList.as_view(), name='group_to_do_list'),
    path('api/update_task/<int:task_id>/', views.ViewToDoList.as_view(), name='update_task_status'),
    path('api/new_task/', views.ViewToDoList.as_view(), name='create_new_task'),
    path('api/delete_task/<int:id>/', views.ViewToDoList.as_view(), name='delete_task'),
    path('api/new_list/', views.ViewToDoList.as_view(), name='create_new_list'),
    path('api/delete_list/<int:id>/', views.ViewToDoList.as_view(), name='delete_list'),

    # Friends endpoints
    path('api/get_friends/', views.FriendsView.as_view(), name='friends'),
    path('api/get_made_requests/', views.FriendsView.as_view(), name='friends_requested'),
    path('api/get_pending_friends/', views.FriendsView.as_view(), name='pending_friends'),
    path('api/accept_friend/<int:id>/', views.FriendsView.as_view(), name='accept_friend'),
    path('api/reject_friend/<int:id>/', views.FriendsView.as_view(), name='reject_friend'),
    path('api/create_friend_request/<int:id>/', views.FriendsView.as_view(), name = 'create_friend_request'),
    path('api/find_friend/', views.FriendsView.as_view(), name='find_friend'),
    path('api/get_friend_profile/<int:id>/', views.FriendsView.as_view(), name='friends_profile'),

    # Profile endpoints
    path('api/motivational-message/', views.motivationalMessage, name='motivation'),
    path('api/check-email/', views.checkEmailView, name='check_email'),
    path('api/check-username/', views.checkUsernameView, name='check_username'),
    path('api/profile/', get_logged_in_user, name='get_logged_in_user'),
    path('api/description/', save_description, name='save_description'),
    path('api/badges/', get_user_badges, name='get_user_badges'),

    #Shared materials endpoint
    path('api/shared_materials/', get_current_session, name='get_current_session'),

    # Calendar events endpoints
    path('api/events/', event_list, name='event-list'),
    path('api/events/<int:pk>/', event_detail, name='event-detail')
]
