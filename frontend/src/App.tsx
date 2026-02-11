import { useState } from "react";
import ChatWindow from "./components/ChatWindow";

function App() {
    const [username, setUsername] = useState("");
    const [isJoined, setIsJoined] = useState(false);

    const handleJoin = (name: string) => {
        setUsername(name);
        setIsJoined(true);
    };

    return (
        <div className="flex h-screen bg-slate-50 w-full overflow-hidden font-sans">
            <ChatWindow
                roomName="general"
                username={username}
                isJoined={isJoined}
                onJoin={handleJoin}
            />
        </div>
    )
}

export default App
