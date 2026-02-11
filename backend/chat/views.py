from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import Room
import json

@require_http_methods(["GET"])
def get_rooms(request):
    rooms = Room.objects.all().values('id', 'name', 'created_by')
    return JsonResponse(list(rooms), safe=False)

@csrf_exempt
@require_http_methods(["POST"])
def create_room(request):
    try:
        data = json.loads(request.body)
        room_name = data.get('name')
        user_id = data.get('user_id')
        if not room_name:
            return JsonResponse({'error': 'Room name is required'}, status=400)
        
        # If room exists, return it. created_by is only set on creation.
        room, created = Room.objects.get_or_create(
            name=room_name,
            defaults={'created_by': user_id}
        )
        return JsonResponse({'id': room.id, 'name': room.name, 'created_by': room.created_by, 'created': created})
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

@csrf_exempt
@require_http_methods(["DELETE"])
def delete_room(request, room_name):
    try:
        # Get user_id from query params or body. DELETE usually doesn't have body in some clients, 
        # but fetch supports it. Let's try query param for safety or assume body.
        # Django HttpRequest.body works for DELETE.
        user_id = None
        try:
            data = json.loads(request.body)
            user_id = data.get('user_id')
        except:
            pass
        
        # Also check query param
        if not user_id:
            user_id = request.GET.get('user_id')

        room = Room.objects.get(name=room_name)
        
        # Ownership check:
        # 1. If room has no creator (legacy), allow deletion (or disallow, but let's allow for now to clean up)
        # 2. If room has creator, user_id must match.
        if room.created_by and room.created_by != user_id:
             return JsonResponse({'error': 'Unauthorized. Only the room creator can delete this room.'}, status=403)

        room.delete()
        return JsonResponse({'message': 'Room deleted successfully'})
    except Room.DoesNotExist:
        return JsonResponse({'error': 'Room not found'}, status=404)
