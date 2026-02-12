import { Send, Smile, Reply, Edit2, X, Trash2, Video, Paperclip } from "lucide-react";
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
    parent_id?: number | null;
    parent_content?: string | null;
    parent_sender?: string | null;
    is_edited?: boolean;
    file_url?: string | null;
    file_type?: 'image' | 'video' | null;
    file_name?: string | null;
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
    const [replyingTo, setReplyingTo] = useState<DisplayMessage | null>(null);
    const [editingMessage, setEditingMessage] = useState<DisplayMessage | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);

    // Connect to Django WebSocket backend
    // Use environment variable for production, fallback to localhost for development
    const baseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/chat/';
    const wsUrl = `${baseUrl}${roomName}/`;
    const { messages, sendMessage, sendReaction, sendTyping, editMessage, deleteMessage, uploadFile, isConnected, typingUsers } = useWebSocket(wsUrl);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // File upload state and refs
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [displayMessages, typingUsers]);

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
            time: msg.timestamp
                ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: msg.sender === username,
            reactions: msg.reactions || [],
            parent_id: msg.parent_id,
            parent_content: msg.parent_content,
            parent_sender: msg.parent_sender,
            is_edited: msg.is_edited,
            file_url: msg.file_url,
            file_type: msg.file_type,
            file_name: msg.file_name
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);

        if (isJoined) {
            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Send typing started if not already (logic simplified: just send true on change,
            // backend/state handles duplicates, but good to check if we want to reduce traffic.
            // For now, let's just send true, but maybe only if we weren't "typing" in our local intent?
            // Actually, simplest is: send true, set timeout to send false.
            // Optimization: We could track if we already sent 'true' to avoid spamming.
            // But consumers.py broadcasts everything.
            // Let's rely on the fact that this event is small.
            // Or better:
            sendTyping(true, username);

            // Set timeout to stop typing
            typingTimeoutRef.current = setTimeout(() => {
                sendTyping(false, username);
            }, 2000);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

        const isImage = allowedImageTypes.includes(file.type);
        const isVideo = allowedVideoTypes.includes(file.type);

        if (!isImage && !isVideo) {
            setError("Invalid file type. Only images and videos are allowed.");
            return;
        }

        const maxSize = isImage ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
        if (file.size > maxSize) {
            setError(`File too large. Max size is ${maxSize / (1024 * 1024)}MB.`);
            return;
        }

        setSelectedFile(file);
        setError("");

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSend = async () => {
        if ((!inputValue.trim() && !selectedFile) || !isJoined) return;

        try {
            if (editingMessage) {
                // Edit existing message
                editMessage(editingMessage.id, inputValue, username);
                setEditingMessage(null);
            } else if (selectedFile) {
                // Upload file
                setIsUploading(true);
                await uploadFile(selectedFile, username, roomName, replyingTo?.id, inputValue);
                handleRemoveFile();
                setReplyingTo(null);
            } else {
                // Send new message (optionally replying)
                sendMessage(username, inputValue, replyingTo?.id);
                setReplyingTo(null);
            }

            setInputValue("");
            setShowEmojiPicker(false);
            setError("");

            // Stop typing immediately when sent
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            sendTyping(false, username);
        } catch (err: any) {
            setError(err.message || "Failed to send message");
        } finally {
            setIsUploading(false);
        }
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

    const handleReply = (msg: DisplayMessage) => {
        setReplyingTo(msg);
        setEditingMessage(null);
    };

    const handleEdit = (msg: DisplayMessage) => {
        setEditingMessage(msg);
        setInputValue(msg.content);
        setReplyingTo(null);
    };

    const cancelReplyOrEdit = () => {
        setReplyingTo(null);
        setEditingMessage(null);
        setInputValue("");
    };

    const handleDelete = (msg: DisplayMessage) => {
        if (confirm('Are you sure you want to delete this message?')) {
            deleteMessage(msg.id, username);
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
                    <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">Welcome to Chat</h2>
                    <p className="text-slate-500 mb-6 text-center">Enter your name and access key to join</p>

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

    const otherTypingUsers = typingUsers.filter(u => u !== username);

    return (
        <div className="flex-1 flex flex-col bg-slate-50 h-full relative w-full">
            {/* Header */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-[90%] md:w-auto max-w-2xl bg-white/80 backdrop-blur-md shadow-lg border border-white/20 rounded-full px-6 py-3 flex items-center justify-between gap-4 md:gap-12 transition-all hover:bg-white/90">
                <div>
                    <h1 className="text-base md:text-lg font-semibold text-slate-800">Chatting as {username}</h1>
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
                                    {/* Parent Message Preview for Replies */}
                                    {msg.parent_content && (
                                        <div className={`mb-2 p-2.5 rounded-xl text-xs border-l-4 ${msg.isMe
                                            ? 'bg-indigo-500/30 border-indigo-300/60 text-white'
                                            : 'bg-slate-100 border-primary text-slate-700'
                                            }`}>
                                            <div className="flex items-center gap-1 mb-1">
                                                <Reply className={`w-3 h-3 ${msg.isMe ? 'text-white/80' : 'text-slate-500'}`} />
                                                <span className={`font-semibold text-[10px] ${msg.isMe ? 'text-white/90' : 'text-slate-600'}`}>{msg.parent_sender}</span>
                                            </div>
                                            <p className={`${msg.isMe ? 'text-white/95' : 'text-slate-600'} max-w-full`} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {msg.parent_content}
                                            </p>
                                        </div>
                                    )}

                                    <div
                                        className={`p-1.5 md:p-2 rounded-2xl shadow-sm text-sm md:text-[15px] leading-relaxed break-words overflow-hidden ${msg.isMe
                                            ? 'bg-primary text-white rounded-tr-none'
                                            : 'bg-white text-slate-600 rounded-tl-none border border-slate-100'
                                            }`}
                                    >
                                        {msg.file_url && (
                                            <div className="mb-1 rounded-xl overflow-hidden bg-slate-100/10">
                                                {msg.file_type === 'image' ? (
                                                    <img
                                                        src={msg.file_url.startsWith('http') ? msg.file_url : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${msg.file_url}`}
                                                        alt={msg.file_name || 'Image'}
                                                        className="w-full max-h-[300px] md:max-h-[400px] object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                                        onClick={() => window.open(msg.file_url?.startsWith('http') ? msg.file_url : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${msg.file_url}`, '_blank')}
                                                    />
                                                ) : msg.file_type === 'video' ? (
                                                    <video
                                                        src={msg.file_url.startsWith('http') ? msg.file_url : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${msg.file_url}`}
                                                        controls
                                                        className="w-full max-h-[300px] md:max-h-[400px]"
                                                    />
                                                ) : null}
                                            </div>
                                        )}
                                        {msg.content && (
                                            <div className="px-2 pb-1.5 pt-0.5 md:px-3 md:pb-2">
                                                {msg.content}
                                                {msg.is_edited && (
                                                    <span className="text-[10px] ml-2 opacity-60">(edited)</span>
                                                )}
                                            </div>
                                        )}
                                        {!msg.content && msg.is_edited && (
                                            <div className="px-2 pb-1.5 pt-0.5 md:px-3 md:pb-2">
                                                <span className="text-[10px] opacity-60">(edited)</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className={`absolute top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${msg.isMe ? '-left-24 md:-left-28' : '-right-24 md:-right-28'
                                        }`}>
                                        <button
                                            onClick={() => handleReply(msg)}
                                            className="p-1.5 rounded-full bg-white shadow-md border border-slate-200 hover:bg-slate-50 hover:scale-110 transition-all"
                                            title="Reply"
                                        >
                                            <Reply className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-500 hover:text-primary" />
                                        </button>
                                        {msg.isMe && (
                                            <>
                                                <button
                                                    onClick={() => handleEdit(msg)}
                                                    className="p-1.5 rounded-full bg-white shadow-md border border-slate-200 hover:bg-slate-50 hover:scale-110 transition-all"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-500 hover:text-blue-500" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(msg)}
                                                    className="p-1.5 rounded-full bg-white shadow-md border border-slate-200 hover:bg-red-50 hover:scale-110 transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-500 hover:text-red-500" />
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => {
                                                setActiveReactionMessageId(msg.id);
                                                setShowEmojiPicker(true);
                                            }}
                                            className="p-1.5 rounded-full bg-white shadow-md border border-slate-200 hover:bg-slate-50 hover:scale-110 transition-all"
                                            title="React"
                                        >
                                            <Smile className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-500 hover:text-yellow-500" />
                                        </button>
                                    </div>
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

                {/* Typing Indicator */}
                {otherTypingUsers.length > 0 && (
                    <div className="flex items-center gap-2 text-slate-400 text-xs ml-4">
                        <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                        </div>
                        <span>
                            {otherTypingUsers.join(", ")} {otherTypingUsers.length === 1 ? "is" : "are"} typing...
                        </span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 md:p-6 bg-white border-t border-slate-100 relative">
                {/* Reply/Edit Preview Bar */}
                {(replyingTo || editingMessage) && (
                    <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-3 mb-3 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3 text-sm">
                            {replyingTo && (
                                <>
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Reply className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 mb-0.5">Replying to</div>
                                        <span className="text-slate-700 font-medium">{replyingTo.sender}</span>
                                        <span className="text-slate-500">: {replyingTo.content.length > 40 ? replyingTo.content.slice(0, 40) + '...' : replyingTo.content}</span>
                                    </div>
                                </>
                            )}
                            {editingMessage && (
                                <>
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                        <Edit2 className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 mb-0.5">Editing message</div>
                                        <span className="text-slate-700">{editingMessage.content.length > 40 ? editingMessage.content.slice(0, 40) + '...' : editingMessage.content}</span>
                                    </div>
                                </>
                            )}
                        </div>
                        <button
                            onClick={cancelReplyOrEdit}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors group"
                            title="Cancel"
                        >
                            <X className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                        </button>
                    </div>
                )}

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

                {/* File Preview before sending */}
                {filePreview && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-white border border-slate-100 shadow-xl rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                            {selectedFile?.type.startsWith('image/') ? (
                                <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-primary">
                                    <Video className="w-8 h-8" />
                                </div>
                            )}
                            {isUploading && (
                                <div className="absolute inset-0 bg-primary/40 backdrop-blur-[1px] flex items-center justify-center">
                                    <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-700 truncate">{selectedFile?.name}</div>
                            <div className="text-xs text-slate-400">
                                {isUploading ? 'Uploading...' : `${(selectedFile!.size / 1024 / 1024).toFixed(2)} MB`}
                            </div>
                        </div>
                        <button
                            onClick={handleRemoveFile}
                            disabled={isUploading}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-2 md:gap-4 bg-slate-50 p-1.5 md:p-2 pr-1.5 md:pr-2 rounded-2xl border border-slate-100 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                    <div className="flex items-center">
                        <button
                            onClick={() => {
                                setActiveReactionMessageId(null);
                                setShowEmojiPicker(!showEmojiPicker);
                            }}
                            className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-slate-200/50 rounded-xl"
                            title="Add Emoji"
                        >
                            <Smile className="w-5 h-5 md:w-6 md:h-6" />
                        </button>

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-slate-200/50 rounded-xl"
                            title="Attach Image/Video"
                            disabled={isUploading}
                        >
                            <Paperclip className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="image/*,video/*"
                            className="hidden"
                        />
                    </div>

                    <input
                        type="text"
                        placeholder={selectedFile ? "Add a caption..." : "Message..."}
                        className="flex-1 bg-transparent px-2 md:px-0 py-2 md:py-3 focus:outline-none text-slate-600 placeholder:text-slate-400 text-sm md:text-base"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        disabled={isUploading}
                    />

                    <div className="flex items-center gap-1 md:gap-2 px-1 md:px-2">
                        <button
                            onClick={handleSend}
                            disabled={isUploading || (!inputValue.trim() && !selectedFile)}
                            className={`p-2 md:p-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary/30 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isUploading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <Send className="w-4 h-4 md:w-5 md:h-5 ml-0.5" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;
