import { MoreHorizontal, Phone, Search, Video, User, Smile, Paperclip, Image as ImageIcon, Send } from "lucide-react";
import { messages } from "../data/mockData";

const ChatWindow = () => {
    return (
        <div className="flex-1 flex flex-col bg-white h-full relative">
            {/* Header */}
            <header className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <img
                            src={messages[1].avatar}
                            alt="Doris Brown"
                            className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">Doris Brown</h3>
                        <span className="flex items-center gap-2 text-green-500 text-sm font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            Online
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-6 text-slate-400">
                    <button className="hover:text-primary transition-colors"><Search className="w-6 h-6" /></button>
                    <button className="hover:text-primary transition-colors"><Phone className="w-6 h-6" /></button>
                    <button className="hover:text-primary transition-colors"><Video className="w-6 h-6" /></button>
                    <button className="hover:text-primary transition-colors"><User className="w-6 h-6" /></button>
                    <button className="hover:text-primary transition-colors"><MoreHorizontal className="w-6 h-6" /></button>
                </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/50">
                <div className="flex justify-center">
                    <span className="px-4 py-1.5 bg-slate-100 text-slate-400 text-xs font-semibold rounded-full uppercase tracking-wider">Today</span>
                </div>

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex items-end gap-4 ${msg.sender === 'me' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                        {msg.sender === 'other' && (
                            <img src={msg.avatar} alt="Sender" className="w-10 h-10 rounded-full object-cover mb-1 shadow-sm" />
                        )}

                        <div className={`flex flex-col gap-1 max-w-[60%] ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}>
                            <div
                                className={`p-4 rounded-2xl shadow-sm text-[15px] leading-relaxed ${msg.sender === 'me'
                                    ? 'bg-primary text-white rounded-tr-none'
                                    : 'bg-white text-slate-600 rounded-tl-none border border-slate-100'
                                    }`}
                            >
                                {msg.content}
                            </div>
                            <div className="flex items-center gap-2 px-1">
                                <span className="text-xs text-slate-400 font-medium">{msg.sender === 'other' ? 'Doris Brown' : 'You'}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span className="text-xs text-slate-400">{msg.time}</span>
                            </div>
                        </div>

                        {msg.sender === 'me' && (
                            <div className="w-10"></div> // Spacer to keep alignment visual balance if needed, or remove
                        )}
                    </div>
                ))}
            </div>

            {/* Input */}
            <div className="p-6 bg-white border-t border-slate-100">
                <div className="flex items-center gap-4 bg-slate-50 p-2 pr-2 rounded-2xl border border-slate-100 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                    <input
                        type="text"
                        placeholder="Enter Message..."
                        className="flex-1 bg-transparent px-4 py-3 focus:outline-none text-slate-600 placeholder:text-slate-400"
                    />

                    <div className="flex items-center gap-2 px-2">
                        <button className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-white rounded-full"><Smile className="w-5 h-5" /></button>
                        <button className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-white rounded-full"><Paperclip className="w-5 h-5" /></button>
                        <button className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-white rounded-full"><ImageIcon className="w-5 h-5" /></button>
                        <button className="p-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary/30">
                            <Send className="w-5 h-5 ml-0.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;
