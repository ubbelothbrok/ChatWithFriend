import { useState, useEffect, useRef, useCallback } from 'react';

interface Message {
    sender: string;
    message: string;
}

interface UseWebSocketReturn {
    messages: Message[];
    sendMessage: (sender: string, message: string) => void;
    isConnected: boolean;
}

const useWebSocket = (url: string): UseWebSocketReturn => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isConnected, setIsConnected] = useState(false);
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
            setMessages((prev) => [...prev, { sender: data.sender, message: data.message }]);
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
            ws.current.send(JSON.stringify({ sender, message }));
        }
    }, []);

    return { messages, sendMessage, isConnected };
};

export default useWebSocket;
