import { Search, Image } from "lucide-react";
import { recentChats } from "../data/mockData";

const ChatListPanel = () => {
    return (
        <div className="w-80 h-full bg-sidebar flex flex-col border-r border-slate-100">
            <div className="p-6 pb-2">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Chats</h2>

                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search messages or users"
                        className="w-full pl-12 pr-4 py-3 bg-white border-none rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm placeholder:text-slate-400"
                    />
                </div>

                {/* Favorites / Active Users section removed */}
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">Recent</h3>

                {recentChats.map((chat) => (
                    <div
                        key={chat.id}
                        className={`p-3 rounded-2xl flex items-start gap-3 cursor-pointer transition-all duration-200 ${chat.active ? 'bg-indigo-50/80 shadow-sm' : 'hover:bg-white hover:shadow-sm'
                            }`}
                    >
                        <div className="relative flex-shrink-0">
                            <img
                                src={chat.avatar}
                                alt={chat.name}
                                className="w-12 h-12 rounded-full object-cover"
                            />
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                                <h4 className="font-semibold text-slate-800 truncate">{chat.name}</h4>
                                <span className={`text-xs ${chat.active ? 'text-indigo-500 font-medium' : 'text-slate-400'}`}>
                                    {chat.time}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                {chat.typing ? (
                                    <span className="text-indigo-500 text-sm font-medium animate-pulse">typing...</span>
                                ) : (
                                    <div className="flex items-center gap-1 text-slate-500 text-sm truncate">
                                        {chat.isImage && <Image className="w-3 h-3" />}
                                        <span className="truncate">{chat.lastMessage}</span>
                                    </div>
                                )}

                                {chat.unread > 0 && (
                                    <span className="w-5 h-5 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-xs font-bold ml-2 flex-shrink-0">
                                        {chat.unread}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChatListPanel;
