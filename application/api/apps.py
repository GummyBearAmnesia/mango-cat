from django.apps import AppConfig


class ApplicationConfig(AppConfig):
    """Configuration class for the 'api' Django application."""

    # Use BigAutoField as default primary key type for models
    default_auto_field = 'django.db.models.BigAutoField'

    # Name of the Django application (must match package name)
    name = 'api'
