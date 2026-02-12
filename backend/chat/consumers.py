import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Message, Room, Reaction

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = 'chat_%s' % self.room_name

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type', 'chat_message')

        if message_type == 'chat_message':
            message = text_data_json['message']
            sender = text_data_json.get('sender', 'Anonymous')
            parent_id = text_data_json.get('parent_id', None)
            
            # Save message to database
            db_message = await self.save_message(sender, message, self.room_name, parent_id)

            # Get parent message content if this is a reply
            parent_content = None
            parent_sender = None
            if db_message.parent:
                parent_content = db_message.parent.content
                parent_sender = db_message.parent.sender

            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'id': db_message.id,
                    'message': message,
                    'sender': sender,
                    'timestamp': str(db_message.timestamp),
                    'reactions': [],
                    'parent_id': parent_id,
                    'parent_content': parent_content,
                    'parent_sender': parent_sender,
                    'is_edited': False,
                    'file_url': None,
                    'file_type': None,
                    'file_name': None
                }
            )
        elif message_type == 'reaction':
            message_id = text_data_json['message_id']
            sender = text_data_json['sender']
            emoji = text_data_json['emoji']

            # Toggle reaction in database
            action = await self.toggle_reaction(message_id, sender, emoji)

            if action != 'error':
                # Send reaction update to room group
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'reaction_update',
                        'message_id': message_id,
                        'sender': sender,
                        'emoji': emoji,
                    }
                )
        elif message_type == 'typing':
            sender = text_data_json['sender']
            is_typing = text_data_json['is_typing']

            # Send typing status to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_typing',
                    'sender': sender,
                    'is_typing': is_typing
                }
            )
        elif message_type == 'edit_message':
            message_id = text_data_json['message_id']
            new_content = text_data_json['content']
            sender = text_data_json['sender']

            # Update message in database
            success = await self.edit_message(message_id, new_content, sender)

            if success:
                # Send update to room group
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'message_edit',
                        'message_id': message_id,
                        'content': new_content,
                        'sender': sender
                    }
                )
        elif message_type == 'delete_message':
            message_id = text_data_json['message_id']
            sender = text_data_json['sender']

            # Delete message from database
            success = await self.delete_message(message_id, sender)

            if success:
                # Send delete notification to room group
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'message_delete',
                        'message_id': message_id
                    }
                )

    # Receive message from room group
    async def chat_message(self, event):
        # Send message to WebSocket
        # If message comes from HTTP upload, it's already in event['message']
        if 'message' in event and isinstance(event['message'], dict):
            msg_data = event['message']
            await self.send(text_data=json.dumps({
                'type': 'chat_message',
                'id': msg_data.get('id'),
                'message': msg_data.get('content', ''),
                'sender': msg_data.get('sender'),
                'timestamp': msg_data.get('timestamp'),
                'reactions': msg_data.get('reactions', []),
                'parent_id': msg_data.get('parent_id'),
                'parent_content': msg_data.get('parent_content'),
                'parent_sender': msg_data.get('parent_sender'),
                'is_edited': msg_data.get('is_edited', False),
                'file_url': msg_data.get('file_url'),
                'file_type': msg_data.get('file_type'),
                'file_name': msg_data.get('file_name')
            }))
        else:
            await self.send(text_data=json.dumps({
                'type': 'chat_message',
                'id': event.get('id'),
                'message': event['message'],
                'sender': event['sender'],
                'timestamp': event.get('timestamp'),
                'reactions': event.get('reactions', []),
                'parent_id': event.get('parent_id'),
                'parent_content': event.get('parent_content'),
                'parent_sender': event.get('parent_sender'),
                'is_edited': event.get('is_edited', False),
                'file_url': event.get('file_url'),
                'file_type': event.get('file_type'),
                'file_name': event.get('file_name')
            }))

    async def reaction_update(self, event):
        # Send reaction update to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'reaction_update',
            'message_id': event['message_id'],
            'sender': event['sender'],
            'emoji': event['emoji'],
            'action': event['action']
        }))

    async def user_typing(self, event):
        # Send typing status to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'user_typing',
            'sender': event['sender'],
            'is_typing': event['is_typing']
        }))

    async def message_edit(self, event):
        # Send message edit to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'message_edit',
            'message_id': event['message_id'],
            'content': event['content']
        }))

    async def message_delete(self, event):
        # Send message deletion to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'message_delete',
            'message_id': event['message_id']
        }))

    @database_sync_to_async
    def save_message(self, sender, content, room_name, parent_id=None):
        room, created = Room.objects.get_or_create(name=room_name)
        parent = None
        if parent_id:
            try:
                parent = Message.objects.get(id=parent_id)
            except Message.DoesNotExist:
                pass
        return Message.objects.create(sender=sender, content=content, room=room, parent=parent)

    @database_sync_to_async
    def toggle_reaction(self, message_id, sender, emoji):
        try:
            message = Message.objects.get(id=message_id)
            reaction, created = Reaction.objects.get_or_create(
                message=message,
                sender=sender,
                emoji=emoji
            )
            if not created:
                reaction.delete()
                return 'removed'
            return 'added'
        except Message.DoesNotExist:
            return 'error'

    @database_sync_to_async
    def edit_message(self, message_id, new_content, sender):
        try:
            message = Message.objects.get(id=message_id, sender=sender)
            message.content = new_content
            message.is_edited = True
            message.save()
            return True
        except Message.DoesNotExist:
            return False

    @database_sync_to_async
    def delete_message(self, message_id, sender):
        try:
            message = Message.objects.get(id=message_id, sender=sender)
            message.delete()
            return True
        except Message.DoesNotExist:
            return False
