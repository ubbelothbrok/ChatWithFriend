import { useState, useEffect, useRef, useCallback } from 'react';

interface Message {
    id: number;
    sender: string;
    message: string;
    timestamp: string;
    reactions: { emoji: string; sender: string }[];
    parent_id?: number | null;
    parent_content?: string | null;
    parent_sender?: string | null;
    is_edited?: boolean;
    file_url?: string | null;
    file_type?: 'image' | 'video' | null;
    file_name?: string | null;
}

interface UseWebSocketReturn {
    messages: Message[];
    sendMessage: (sender: string, message: string, parentId?: number | null) => void;
    sendReaction: (messageId: number, emoji: string, sender: string) => void;
    editMessage: (messageId: number, content: string, sender: string) => void;
    deleteMessage: (messageId: number, sender: string) => void;
    uploadFile: (file: File, sender: string, roomName: string, parentId?: number | null, content?: string) => Promise<void>;
    isConnected: boolean;
    typingUsers: string[];
    sendTyping: (isTyping: boolean, sender: string) => void;
}

const useWebSocket = (url: string): UseWebSocketReturn => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        // Create WebSocket connection
        ws.current = new WebSocket(url);

        ws.current.onopen = () => {
            console.log('WebSocket connected');
            setIsConnected(true);
        };

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'chat_message') {
                setMessages((prev) => [...prev, {
                    id: data.id,
                    sender: data.sender,
                    message: data.message,
                    reactions: data.reactions || [],
                    timestamp: data.timestamp,
                    parent_id: data.parent_id,
                    parent_content: data.parent_content,
                    parent_sender: data.parent_sender,
                    is_edited: data.is_edited || false,
                    file_url: data.file_url,
                    file_type: data.file_type,
                    file_name: data.file_name
                }]);
            } else if (data.type === 'reaction_update') {
                setMessages((prev) => prev.map(msg => {
                    if (msg.id === data.message_id) {
                        const currentReactions = msg.reactions || [];
                        let newReactions = [...currentReactions];

                        if (data.action === 'added') {
                            newReactions.push({ emoji: data.emoji, sender: data.sender });
                        } else if (data.action === 'removed') {
                            newReactions = newReactions.filter(r =>
                                !(r.emoji === data.emoji && r.sender === data.sender)
                            );
                        }
                        return { ...msg, reactions: newReactions };
                    }
                    return msg;
                }));
            } else if (data.type === 'user_typing') {
                setTypingUsers((prev) => {
                    if (data.is_typing) {
                        return prev.includes(data.sender) ? prev : [...prev, data.sender];
                    } else {
                        return prev.filter(user => user !== data.sender);
                    }
                });
            } else if (data.type === 'message_edit') {
                setMessages((prev) => prev.map(msg => {
                    if (msg.id === data.message_id) {
                        return { ...msg, message: data.content, is_edited: true };
                    }
                    return msg;
                }));
            } else if (data.type === 'message_delete') {
                setMessages((prev) => prev.filter(msg => msg.id !== data.message_id));
            }
        };

        ws.current.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.current.onclose = () => {
            console.log('WebSocket disconnected');
            setIsConnected(false);
        };

        // Cleanup on unmount
        return () => {
            ws.current?.close();
        };
    }, [url]);

    const sendMessage = useCallback((sender: string, message: string, parentId?: number | null) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                type: 'chat_message',
                message,
                sender,
                ...(parentId && { parent_id: parentId })
            }));
        }
    }, []);

    const sendReaction = useCallback((messageId: number, emoji: string, sender: string) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                type: 'reaction',
                message_id: messageId,
                emoji,
                sender
            }));
        }
    }, []);

    const sendTyping = useCallback((isTyping: boolean, sender: string) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                type: 'typing',
                is_typing: isTyping,
                sender
            }));
        }
    }, []);

    const editMessage = useCallback((messageId: number, content: string, sender: string) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                type: 'edit_message',
                message_id: messageId,
                content,
                sender
            }));
        }
    }, []);

    const deleteMessage = useCallback((messageId: number, sender: string) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                type: 'delete_message',
                message_id: messageId,
                sender
            }));
        }
    }, []);

    const uploadFile = useCallback(async (file: File, sender: string, roomName: string, parentId?: number | null, content?: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('sender', sender);
        formData.append('room_name', roomName);
        if (parentId) formData.append('parent_id', parentId.toString());
        if (content) formData.append('content', content);

        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        try {
            const response = await fetch(`${baseUrl}/api/upload-file/`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to upload file');
            }

            // The file upload view broadcasts the message, so we don't need to manually update local state.
            // But we could if we wanted immediate feedback.
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    }, []);

    return { messages, sendMessage, sendReaction, sendTyping, editMessage, deleteMessage, uploadFile, isConnected, typingUsers };
};

export default useWebSocket;
