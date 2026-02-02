import { Send } from "lucide-react";
import { useState, useRef, useEffect, KeyboardEvent } from "react";
import useWebSocket from "../hooks/useWebSocket";

interface DisplayMessage {
    id: number;
    sender: string;
    content: string;
    time: string;
    isMe: boolean;
}

const ChatWindow = () => {
    const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [username, setUsername] = useState("");
    const [isUsernameSet, setIsUsernameSet] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Connect to Django WebSocket backend
    const { messages, sendMessage, isConnected } = useWebSocket('ws://localhost:8000/ws/chat/');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [displayMessages]);

    // Convert WebSocket messages to display format
    useEffect(() => {
        const newDisplayMessages = messages.map((msg, index) => ({
            id: Date.now() + index,
            sender: msg.sender,
            content: msg.message,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: msg.sender === username
        }));
        setDisplayMessages(newDisplayMessages);
    }, [messages, username]);

    const handleSetUsername = () => {
        if (username.trim()) {
            setIsUsernameSet(true);
        }
    };

    const handleSend = () => {
        if (!inputValue.trim() || !isUsernameSet) return;

        sendMessage(username, inputValue);
        setInputValue("");
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            if (!isUsernameSet) {
                handleSetUsername();
            } else {
                handleSend();
            }
        }
    };

    // Username setup screen
    if (!isUsernameSet) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50 h-full">
                <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full mx-4">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome to Chat</h2>
                    <p className="text-slate-500 mb-6">Enter your name to start chatting</p>
                    <input
                        type="text"
                        placeholder="Your name..."
                        className="w-full px-4 py-3 bg-white text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 mb-4"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                    />
                    <button
                        onClick={handleSetUsername}
                        className="w-full py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors font-medium"
                    >
                        Join Chat
                    </button>
                    <div className="mt-4 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-xs text-slate-500">
                            {isConnected ? 'Connected to server' : 'Connecting...'}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-white h-full relative w-full">
            {/* Header */}
            <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-slate-800">Global Chat</h1>
                    <p className="text-xs text-slate-500">Chatting as {username}</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-xs text-slate-500">
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 bg-slate-50/50">
                <div className="flex justify-center">
                    <span className="px-4 py-1.5 bg-slate-100 text-slate-400 text-[10px] md:text-xs font-semibold rounded-full uppercase tracking-wider">Today</span>
                </div>

                {displayMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm md:text-base">
                        <p>No messages yet. Start a conversation!</p>
                    </div>
                )}

                {displayMessages.map((msg, index) => {
                    // Check if this is the last message in a group (next message is from different sender or last message)
                    const isLastInGroup = index === displayMessages.length - 1 ||
                        displayMessages[index + 1].sender !== msg.sender;

                    return (
                        <div
                            key={msg.id}
                            className={`flex items-start gap-2 md:gap-4 ${msg.isMe ? 'flex-row-reverse' : 'flex-row'} ${!isLastInGroup ? 'mb-1' : ''}`}
                        >
                            <div className={`flex flex-col gap-1 max-w-[75%] md:max-w-[60%] ${msg.isMe ? 'items-end' : 'items-start'}`}>
                                <div
                                    className={`p-3 md:p-4 rounded-2xl shadow-sm text-sm md:text-[15px] leading-relaxed break-words ${msg.isMe
                                        ? 'bg-primary text-white rounded-tr-none'
                                        : 'bg-white text-slate-600 rounded-tl-none border border-slate-100'
                                        }`}
                                >
                                    {msg.content}
                                </div>
                                {isLastInGroup && (
                                    <div className="flex items-center gap-2 px-1">
                                        <span className="text-[10px] md:text-xs text-slate-400 font-medium">{msg.isMe ? 'You' : msg.sender}</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                        <span className="text-[10px] md:text-xs text-slate-400">{msg.time}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 md:p-6 bg-white border-t border-slate-100">
                <div className="flex items-center gap-2 md:gap-4 bg-slate-50 p-1.5 md:p-2 pr-1.5 md:pr-2 rounded-2xl border border-slate-100 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                    <input
                        type="text"
                        placeholder="Message..."
                        className="flex-1 bg-transparent px-3 md:px-4 py-2 md:py-3 focus:outline-none text-slate-600 placeholder:text-slate-400 text-sm md:text-base"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />

                    <div className="flex items-center gap-1 md:gap-2 px-1 md:px-2">
                        <button
                            onClick={handleSend}
                            className="p-2 md:p-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary/30"
                        >
                            <Send className="w-4 h-4 md:w-5 md:h-5 ml-0.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;
