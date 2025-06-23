import os
from pathlib import Path
from datetime import timedelta

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-4@%dj!95ry*b51e+zcg804m3*_t5-=s)+30--c3^66a=+y#l4y'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = [
    "localhost",  # For local development
    ##"http://127.0.0.1:8000/api", # Localhost IP
    "127.0.0.1",  # Localhost IP
    "https://virtual-study-room-phi.vercel.app", # real website
    "*"
]


# Application definition

INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'frontend',
    'backend',
    'api.apps.ApplicationConfig',
    'django_seed',
    'corsheaders',
    'channels',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=5),  # Access token expires after 5 minutes
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),  # Refresh token expires after 1 day
    "ROTATE_REFRESH_TOKENS": True,  # Issues a new refresh token on each refresh
    "BLACKLIST_AFTER_ROTATION": True,  # Blacklists old refresh tokens after rotation
    "AUTH_HEADER_TYPES": ("Bearer",),  # Authorization: Bearer <token>
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    )
}

ASGI_APPLICATION = "backend.asgi.application"
CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer", # when we deploy change to redis?
            # "BACKEND": "channels_redis.core.RedisChannelLayer", ?
        }
}

ROOT_URLCONF = 'backend.urls'

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # React frontend
    "http://127.0.0.1:8000",
    "https://virtual-study-room-phi.vercel.app", # real website
]

# Security settings
CSRF_COOKIE_HTTPONLY = True  # Enable HTTPOnly for CSRF cookie

# Optional: If you're using JWT, you can also disable CSRF for API requests
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",  # If your frontend is running on localhost:3000 (adjust as needed)
    

]

SESSION_COOKIE_SAMESITE = 'Lax'  # or 'None' for testing
SESSION_COOKIE_SECURE = False    # True if you're using HTTPS


# If you don't want to require CSRF tokens for your API calls (use with caution)
CSRF_COOKIE_SECURE = False  # Ensures CSRF cookie is sent over HTTP (set to True for production)

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            os.path.join(BASE_DIR, 'frontend/build')
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]


CORS_ALLOW_HEADERS = [
    'content-type',
    'authorization',
    'accept',
    'x-csrftoken',
    'x-requested-with',
]

CORS_ALLOW_METHODS = [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
]

WSGI_APPLICATION = 'backend.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/

STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATIC_URL = 'static/'

STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'frontend/build/static'),
]

# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# User custom User model instead of default
AUTH_USER_MODEL = "api.User"
