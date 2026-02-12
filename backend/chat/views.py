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

@csrf_exempt
@require_http_methods(["POST"])
def upload_file(request):
    """Handle file uploads for chat messages"""
    try:
        # Get form data
        file = request.FILES.get('file')
        sender = request.POST.get('sender')
        room_name = request.POST.get('room_name')
        parent_id = request.POST.get('parent_id')
        content = request.POST.get('content', '')  # Optional text content with file
        
        if not file or not sender or not room_name:
            return JsonResponse({'error': 'Missing required fields'}, status=400)
        
        # Validate file type
        allowed_image_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        allowed_video_types = ['video/mp4', 'video/webm', 'video/quicktime']
        
        file_type = None
        if file.content_type in allowed_image_types:
            file_type = 'image'
            max_size = 10 * 1024 * 1024  # 10MB
        elif file.content_type in allowed_video_types:
            file_type = 'video'
            max_size = 50 * 1024 * 1024  # 50MB
        else:
            return JsonResponse({'error': 'Invalid file type. Only images (jpg, png, gif, webp) and videos (mp4, webm, mov) are allowed.'}, status=400)
        
        # Validate file size
        if file.size > max_size:
            return JsonResponse({'error': f'File too large. Maximum size is {max_size // (1024 * 1024)}MB for {file_type}s.'}, status=400)
        
        # Get or create room
        from .models import Room, Message
        room, _ = Room.objects.get_or_create(name=room_name)
        
        # Get parent message if specified
        parent = None
        if parent_id:
            try:
                parent = Message.objects.get(id=parent_id)
            except Message.DoesNotExist:
                pass
        
        # Save message with file
        message = Message.objects.create(
            room=room,
            sender=sender,
            content=content,
            file=file,
            file_type=file_type,
            file_name=file.name,
            parent=parent
        )
        
        # Return message data including file URL
        from django.conf import settings
        file_url = settings.MEDIA_URL + str(message.file) if message.file else None
        
        response_data = {
            'id': message.id,
            'sender': message.sender,
            'content': message.content,
            'timestamp': message.timestamp.isoformat(),
            'file_url': file_url,
            'file_type': file_type,
            'file_name': message.file_name,
            'parent_id': parent.id if parent else None,
            'parent_sender': parent.sender if parent else None,
            'parent_content': parent.content if parent else None,
            'is_edited': False
        }
        
        # Broadcast the new message via WebSocket
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"chat_{room_name}",
            {
                'type': 'chat_message',
                'message': response_data
            }
        )
        
        return JsonResponse(response_data)
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
