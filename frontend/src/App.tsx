import { useState } from "react";
import ChatWindow from "./components/ChatWindow";
import ChatList from "./components/ChatList";

function App() {
    const [currentRoom, setCurrentRoom] = useState("");
    const [username, setUsername] = useState("");
    const [isJoined, setIsJoined] = useState(false);

    const handleJoin = (name: string) => {
        setUsername(name);
        setIsJoined(true);
    };

    return (
        <div className="flex h-screen bg-slate-50 w-full overflow-hidden font-sans">
            <ChatList currentRoom={currentRoom} onSelectRoom={setCurrentRoom} />
            {currentRoom ? (
                <ChatWindow
                    key={currentRoom}
                    roomName={currentRoom}
                    username={username}
                    isJoined={isJoined}
                    onJoin={handleJoin}
                />
            ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400">
                    Select a chat to start messaging
                </div>
            )}
        </div>
    )
}

export default App
