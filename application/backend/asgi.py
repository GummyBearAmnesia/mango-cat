import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from api.routing import websocket_urlpatterns

# Set default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# ASGI application router that handles both HTTP and WebSocket protocols
application = ProtocolTypeRouter({

    # Standard HTTP requests -> Django ASGI application
    "http": get_asgi_application(),
    
    # WebSocket connections -> Custom URL routing from api/routing.py
    "websocket": URLRouter(websocket_urlpatterns),
})