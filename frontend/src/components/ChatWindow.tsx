import { Send } from "lucide-react";
import { useState, useRef, useEffect, KeyboardEvent } from "react";

interface Message {
    id: number;
    sender: 'me' | 'other';
    content: string;
    time: string;
}

const ChatWindow = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (!inputValue.trim()) return;

        const newMessage: Message = {
            id: Date.now(),
            sender: 'me',
            content: inputValue,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, newMessage]);
        setInputValue("");
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    // Static avatar for now since we removed the sidebar
    const otherAvatar = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80";

    return (
        <div className="flex-1 flex flex-col bg-white h-full relative w-full">
            {/* Header */}
            {/* Header removed */}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 bg-slate-50/50">
                <div className="flex justify-center">
                    <span className="px-4 py-1.5 bg-slate-100 text-slate-400 text-[10px] md:text-xs font-semibold rounded-full uppercase tracking-wider">Today</span>
                </div>

                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm md:text-base">
                        <p>No messages yet. Start a conversation!</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex items-end gap-2 md:gap-4 ${msg.sender === 'me' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                        {msg.sender === 'other' && (
                            <img src={otherAvatar} alt="Sender" className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover mb-1 shadow-sm" />
                        )}

                        <div className={`flex flex-col gap-1 max-w-[75%] md:max-w-[60%] ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}>
                            <div
                                className={`p-3 md:p-4 rounded-2xl shadow-sm text-sm md:text-[15px] leading-relaxed break-words ${msg.sender === 'me'
                                    ? 'bg-primary text-white rounded-tr-none'
                                    : 'bg-white text-slate-600 rounded-tl-none border border-slate-100'
                                    }`}
                            >
                                {msg.content}
                            </div>
                            <div className="flex items-center gap-2 px-1">
                                <span className="text-[10px] md:text-xs text-slate-400 font-medium">{msg.sender === 'other' ? 'Doris Brown' : 'You'}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span className="text-[10px] md:text-xs text-slate-400">{msg.time}</span>
                            </div>
                        </div>
                    </div>
                ))}
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

