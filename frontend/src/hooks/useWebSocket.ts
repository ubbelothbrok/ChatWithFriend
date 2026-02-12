import { useState, useEffect, useRef, useCallback } from 'react';

interface Message {
    id: number;
    sender: string;
    message: string;
    timestamp: string;
    reactions: { emoji: string; sender: string }[];
}

interface UseWebSocketReturn {
    messages: Message[];
    sendMessage: (sender: string, message: string) => void;
    sendReaction: (messageId: number, emoji: string, sender: string) => void;
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
                    timestamp: data.timestamp
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

    const sendMessage = useCallback((sender: string, message: string) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                type: 'chat_message',
                message,
                sender
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

    return { messages, sendMessage, sendReaction, sendTyping, isConnected, typingUsers };
};

export default useWebSocket;
