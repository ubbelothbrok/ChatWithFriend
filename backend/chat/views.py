from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import Room
import json

@require_http_methods(["GET"])
def get_rooms(request):
    rooms = Room.objects.all().values('id', 'name')
    return JsonResponse(list(rooms), safe=False)

@csrf_exempt
@require_http_methods(["POST"])
def create_room(request):
    try:
        data = json.loads(request.body)
        room_name = data.get('name')
        if not room_name:
            return JsonResponse({'error': 'Room name is required'}, status=400)
        
        room, created = Room.objects.get_or_create(name=room_name)
        return JsonResponse({'id': room.id, 'name': room.name, 'created': created})
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

@csrf_exempt
@require_http_methods(["DELETE"])
def delete_room(request, room_name):
    try:
        room = Room.objects.get(name=room_name)
        room.delete()
        return JsonResponse({'message': 'Room deleted successfully'})
    except Room.DoesNotExist:
        return JsonResponse({'error': 'Room not found'}, status=404)
