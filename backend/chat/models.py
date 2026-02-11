from django.db import models

class Room(models.Model):
    name = models.CharField(max_length=255, unique=True)
    created_by = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return self.name

class Message(models.Model):
    room = models.ForeignKey(Room, related_name='messages', on_delete=models.CASCADE, null=True, blank=True)
    sender = models.CharField(max_length=255)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender}: {self.content}"

class Reaction(models.Model):
    message = models.ForeignKey(Message, related_name='message_reactions', on_delete=models.CASCADE)
    sender = models.CharField(max_length=255)
    emoji = models.CharField(max_length=10) # Store the emoji character

    class Meta:
        unique_together = ('message', 'sender', 'emoji') # One user can react with same emoji only once per message

    def __str__(self):
        return f"{self.sender} reacted {self.emoji} to message {self.message.id}"
