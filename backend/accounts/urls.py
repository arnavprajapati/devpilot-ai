from django.urls import path
from .views import (
    csrf_view,
    current_user_view,
    login_view,
    logout_view,
    register_view,
)

urlpatterns = [
    path('csrf/', csrf_view, name='csrf'),
    path('register/', register_view, name='register'),
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path('me/', current_user_view, name='current_user'),
]
