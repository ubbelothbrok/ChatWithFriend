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
            
            # Save message to database
            db_message = await self.save_message(sender, message, self.room_name)

            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'id': db_message.id,
                    'message': message,
                    'sender': sender,
                    'timestamp': str(db_message.timestamp),
                    'reactions': []
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
                        'action': action, # 'added' or 'removed'
                    }
                )

    # Receive message from room group
    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'id': event.get('id'),
            'message': event['message'],
            'sender': event['sender'],
            'timestamp': event.get('timestamp'),
            'reactions': event.get('reactions', [])
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

    @database_sync_to_async
    def save_message(self, sender, content, room_name):
        room, created = Room.objects.get_or_create(name=room_name)
        return Message.objects.create(sender=sender, content=content, room=room)

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
