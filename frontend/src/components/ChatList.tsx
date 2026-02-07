import { useState, useEffect } from 'react';
import { Plus, MessageSquare, Hash, Trash2 } from 'lucide-react';

interface Room {
    id: number;
    name: string;
}

interface ChatListProps {
    currentRoom: string;
    onSelectRoom: (roomName: string) => void;
}

const ChatList = ({ currentRoom, onSelectRoom }: ChatListProps) => {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [newRoomName, setNewRoomName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/rooms/');
            if (response.ok) {
                const data = await response.json();
                setRooms(data);
                if (data.length > 0 && !currentRoom) {
                    onSelectRoom(data[0].name);
                }
            }
        } catch (error) {
            console.error('Error fetching rooms:', error);
        }
    };

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRoomName.trim()) return;

        try {
            const response = await fetch('http://localhost:8000/api/rooms/create/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: newRoomName }),
            });

            if (response.ok) {
                const room = await response.json();
                setRooms([...rooms, room]);
                setNewRoomName("");
                setIsCreating(false);
                onSelectRoom(room.name);
            }
        } catch (error) {
            console.error('Error creating room:', error);
        }
    };

    const handleDeleteRoom = async (e: React.MouseEvent, roomName: string) => {
        e.stopPropagation(); // prevent selecting the room when clicking delete
        if (!confirm(`Are you sure you want to delete room "${roomName}"?`)) return;

        try {
            const response = await fetch(`http://localhost:8000/api/rooms/${roomName}/delete/`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setRooms(rooms.filter(r => r.name !== roomName));
                if (currentRoom === roomName) {
                    onSelectRoom("");
                }
            }
        } catch (error) {
            console.error('Error deleting room:', error);
        }
    };

    return (
        <div className="w-full md:w-80 bg-slate-50 border-r border-slate-200 flex flex-col h-full">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    Chats
                </h2>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <Plus className="w-5 h-5 text-slate-600" />
                </button>
            </div>

            {isCreating && (
                <form onSubmit={handleCreateRoom} className="p-4 bg-white border-b border-slate-200">
                    <input
                        type="text"
                        placeholder="New room name..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        autoFocus
                    />
                </form>
            )}

            <div className="flex-1 overflow-y-auto">
                {rooms.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">
                        No conversations yet
                    </div>
                ) : (
                    <div className="space-y-1 p-2">
                        {rooms.map((room) => (
                            <div
                                key={room.id}
                                className={`group w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors cursor-pointer ${currentRoom === room.name
                                    ? 'bg-white shadow-sm border border-slate-100'
                                    : 'hover:bg-slate-100'
                                    }`}
                                onClick={() => onSelectRoom(room.name)}
                            >
                                <div className={`p-2 rounded-lg ${currentRoom === room.name ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                    <Hash className="w-4 h-4" />
                                </div>
                                <span className={`flex-1 font-medium truncate ${currentRoom === room.name ? 'text-slate-900' : 'text-slate-600'
                                    }`}>
                                    {room.name}
                                </span>
                                <button
                                    onClick={(e) => handleDeleteRoom(e, room.name)}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-md transition-all"
                                    title="Delete room"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatList;
