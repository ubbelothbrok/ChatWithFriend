import { MessageSquare, Moon, Settings, User, Users, Globe } from "lucide-react";
import { useState } from "react";

const NavigationRail = () => {
    const [active, setActive] = useState("chat");

    const navItems = [
        { id: "profile", icon: User },
        { id: "chat", icon: MessageSquare },
        { id: "contacts", icon: Users },
        { id: "settings", icon: Settings },
        { id: "language", icon: Globe },
    ];

    return (
        <div className="w-20 h-full bg-white border-r border-slate-100 flex flex-col items-center py-6 justify-between flex-shrink-0">
            <div className="flex flex-col items-center gap-8">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
                    {/* Logo placeholder or App Icon */}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                </div>

                <nav className="flex flex-col gap-6">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActive(item.id)}
                            className={`p-3 rounded-xl transition-all duration-300 relative group ${active === item.id
                                ? "text-primary bg-primary/5 shadow-md shadow-primary/10"
                                : "text-slate-400 hover:text-primary hover:bg-slate-50"
                                }`}
                        >
                            <item.icon className="w-6 h-6" />
                            {active === item.id && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full -ml-[22px]" />
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="flex flex-col items-center gap-6">
                <button className="p-3 text-slate-400 hover:text-primary transition-colors">
                    <Moon className="w-6 h-6" />
                </button>
                <button className="relative">
                    <img
                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                </button>
            </div>
        </div>
    );
};

export default NavigationRail;
