from django.urls import path
from . import views

urlpatterns = [
    path('api/rooms/', views.get_rooms, name='get_rooms'),
    path('api/rooms/create/', views.create_room, name='create_room'),
    path('api/rooms/<str:room_name>/delete/', views.delete_room, name='delete_room'),
]
