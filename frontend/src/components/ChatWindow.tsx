import { Send, Smile } from "lucide-react";
import { useState, useRef, useEffect, KeyboardEvent } from "react";
import useWebSocket from "../hooks/useWebSocket";
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface DisplayMessage {
    id: number;
    sender: string;
    content: string;
    time: string;
    isMe: boolean;
    reactions: { emoji: string; sender: string }[];
}

interface ChatWindowProps {
    roomName: string;
    username: string;
    isJoined: boolean;
    onJoin: (name: string) => void;
}

const ChatWindow = ({ roomName, username, isJoined, onJoin }: ChatWindowProps) => {
    const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [localUsername, setLocalUsername] = useState(username);
    const [accessKey, setAccessKey] = useState("");
    const [error, setError] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [activeReactionMessageId, setActiveReactionMessageId] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);

    // Connect to Django WebSocket backend
    // Use environment variable for production, fallback to localhost for development
    const baseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/chat/';
    const wsUrl = `${baseUrl}${roomName}/`;
    const { messages, sendMessage, sendReaction, isConnected } = useWebSocket(wsUrl);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [displayMessages]);

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
                setActiveReactionMessageId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Convert WebSocket messages to display format
    useEffect(() => {
        const newDisplayMessages = messages.map((msg, index) => ({
            id: msg.id || Date.now() + index,
            sender: msg.sender,
            content: msg.message,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: msg.sender === username,
            reactions: msg.reactions || []
        }));
        setDisplayMessages(newDisplayMessages);
    }, [messages, username]);

    const handleJoinChat = () => {
        setError("");
        if (!localUsername.trim()) {
            setError("Please enter your name");
            return;
        }
        if (accessKey !== "ashu") {
            setError("Invalid access key");
            return;
        }
        onJoin(localUsername);
    };

    const handleSend = () => {
        if (!inputValue.trim() || !isJoined) return;

        sendMessage(username, inputValue);
        setInputValue("");
        setShowEmojiPicker(false);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            if (!isJoined) {
                handleJoinChat();
            } else {
                handleSend();
            }
        }
    };

    const onEmojiClick = (emojiData: EmojiClickData) => {
        if (activeReactionMessageId !== null) {
            sendReaction(activeReactionMessageId, emojiData.emoji, username);
            setActiveReactionMessageId(null);
            setShowEmojiPicker(false);
        } else {
            setInputValue(prev => prev + emojiData.emoji);
        }
    };

    // Helper to aggregate reactions for display
    const getAggregatedReactions = (reactions: { emoji: string; sender: string }[]) => {
        const aggregated: Record<string, string[]> = {};
        reactions.forEach(r => {
            if (!aggregated[r.emoji]) {
                aggregated[r.emoji] = [];
            }
            if (!aggregated[r.emoji].includes(r.sender)) {
                aggregated[r.emoji].push(r.sender);
            }
        });
        return aggregated;
    };

    // Username setup screen
    if (!isJoined) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50 h-full">
                <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full mx-4">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome to Chat</h2>
                    <p className="text-slate-500 mb-6">Enter your name and access key to join</p>

                    <div className="space-y-4 mb-6">
                        <div>
                            <input
                                type="text"
                                placeholder="Your name..."
                                className="w-full px-4 py-3 bg-white text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={localUsername}
                                onChange={(e) => setLocalUsername(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                placeholder="Access Key"
                                className="w-full px-4 py-3 bg-white text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={accessKey}
                                onChange={(e) => setAccessKey(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    </div>

                    <button
                        onClick={handleJoinChat}
                        className="w-full py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors font-medium"
                    >
                        Join Chat
                    </button>
                    <div className="mt-4 flex items-center gap-2 justify-center">
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
        <div className="flex-1 flex flex-col bg-slate-50 h-full relative w-full">
            {/* Header */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-[90%] md:w-auto max-w-2xl bg-white/80 backdrop-blur-md shadow-lg border border-white/20 rounded-full px-6 py-3 flex items-center justify-between gap-4 md:gap-12 transition-all hover:bg-white/90">
                <div>
                    <h1 className="text-base md:text-lg font-semibold text-slate-800">Chat: {roomName}</h1>
                    <p className="text-[10px] md:text-xs text-slate-500">Chatting as {username}</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                    <span className="text-[10px] md:text-xs text-slate-500 font-medium">
                        {isConnected ? 'Live' : 'Offline'}
                    </span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-24 md:pt-28 space-y-6 md:space-y-8">
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

                    const aggregatedReactions = getAggregatedReactions(msg.reactions);

                    return (
                        <div
                            key={msg.id}
                            className={`flex items-start gap-2 md:gap-4 ${msg.isMe ? 'flex-row-reverse' : 'flex-row'} ${!isLastInGroup ? 'mb-1' : ''} group`}
                        >
                            <div className={`flex flex-col gap-1 max-w-[75%] md:max-w-[60%] ${msg.isMe ? 'items-end' : 'items-start'}`}>
                                <div className="relative">
                                    <div
                                        className={`p-3 md:p-4 rounded-2xl shadow-sm text-sm md:text-[15px] leading-relaxed break-words ${msg.isMe
                                            ? 'bg-primary text-white rounded-tr-none'
                                            : 'bg-white text-slate-600 rounded-tl-none border border-slate-100'
                                            }`}
                                    >
                                        {msg.content}
                                    </div>

                                    {/* Add Reaction Button */}
                                    <button
                                        onClick={() => {
                                            setActiveReactionMessageId(msg.id);
                                            setShowEmojiPicker(true);
                                        }}
                                        className={`absolute top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white shadow-sm border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity ${msg.isMe ? '-left-10' : '-right-10'
                                            }`}
                                    >
                                        <Smile className="w-4 h-4 text-slate-400 hover:text-primary" />
                                    </button>
                                </div>

                                {/* Reactions Display */}
                                {Object.keys(aggregatedReactions).length > 0 && (
                                    <div className={`flex flex-wrap gap-1 mt-1 ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                                        {Object.entries(aggregatedReactions).map(([emoji, senders]) => (
                                            <button
                                                key={emoji}
                                                onClick={() => sendReaction(msg.id, emoji, username)}
                                                className={`px-1.5 py-0.5 rounded-full text-xs border flex items-center gap-1 hover:bg-slate-50 transition-colors ${senders.includes(username)
                                                    ? 'bg-primary/5 border-primary/20 text-primary'
                                                    : 'bg-white border-slate-200 text-slate-500'
                                                    }`}
                                                title={senders.join(', ')}
                                            >
                                                <span>{emoji}</span>
                                                <span className="text-[10px] font-medium">{senders.length}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

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
            <div className="p-3 md:p-6 bg-white border-t border-slate-100 relative">
                {/* Emoji Picker Popover */}
                {showEmojiPicker && (
                    <div
                        ref={emojiPickerRef}
                        className="absolute bottom-full right-4 mb-2 z-50 shadow-xl rounded-xl border border-slate-100"
                    >
                        <EmojiPicker
                            onEmojiClick={onEmojiClick}
                            width={300}
                            height={400}
                        />
                    </div>
                )}

                <div className="flex items-center gap-2 md:gap-4 bg-slate-50 p-1.5 md:p-2 pr-1.5 md:pr-2 rounded-2xl border border-slate-100 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                    <button
                        onClick={() => {
                            setActiveReactionMessageId(null);
                            setShowEmojiPicker(!showEmojiPicker);
                        }}
                        className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-slate-200/50 rounded-xl"
                    >
                        <Smile className="w-5 h-5 md:w-6 md:h-6" />
                    </button>

                    <input
                        type="text"
                        placeholder="Message..."
                        className="flex-1 bg-transparent px-2 md:px-0 py-2 md:py-3 focus:outline-none text-slate-600 placeholder:text-slate-400 text-sm md:text-base"
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
