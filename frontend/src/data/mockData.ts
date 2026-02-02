export const users = [
    {
        id: 1,
        name: "Doris Brown",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
        status: "online",
    },
    {
        id: 2,
        name: "Patrick Hendricks",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
        status: "online",
    },
    {
        id: 3,
        name: "Emily",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
        status: "online",
    },
    {
        id: 4,
        name: "Steve Walker",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
        status: "online",
    },
    {
        id: 5,
        name: "Mark Messer",
        avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80",
        status: "online",
    },
    {
        id: 6,
        name: "General",
        avatar: "https://ui-avatars.com/api/?name=General&background=e0e7ff&color=4f46e5",
        status: "offline",
        isGroup: true
    }
];

export const recentChats = [
    {
        id: 1,
        userId: 2,
        name: "Patrick Hendricks",
        lastMessage: "hey! there I'm available",
        time: "02:50 PM",
        unread: 0,
        typing: false,
        avatar: users[1].avatar
    },
    {
        id: 2,
        userId: 5,
        name: "Mark Messer",
        lastMessage: "Images",
        isImage: true,
        time: "10:30 AM",
        unread: 2,
        typing: false,
        avatar: users[4].avatar
    },
    {
        id: 3,
        userId: 6,
        name: "General",
        lastMessage: "This theme is Awesome!",
        time: "2:06 min",
        unread: 0,
        typing: false,
        avatar: users[5].avatar
    },
    {
        id: 4,
        userId: 1,
        name: "Doris Brown",
        lastMessage: "typing...",
        time: "10:05 PM",
        unread: 0,
        typing: true,
        active: true,
        avatar: users[0].avatar
    },
    {
        id: 5,
        userId: 99,
        name: "Designer",
        lastMessage: "Next meeting tomorrow 10.00AM",
        time: "2:10 min",
        unread: 1,
        typing: false,
        avatar: "https://ui-avatars.com/api/?name=Designer&background=f3e8ff&color=9333ea"
    }
];

export const messages = [
    {
        id: 1,
        sender: "me",
        content: "Good Morning",
        time: "10:00",
    },
    {
        id: 2,
        sender: "other",
        content: "Good morning, How are you? What about our next meeting?",
        time: "10:02",
        avatar: users[0].avatar,
    },
    {
        id: 3,
        sender: "me",
        content: "Yeah everything is fine",
        time: "10:05",
    },
    {
        id: 4,
        sender: "me",
        content: "& Next meeting tomorrow 10.00AM",
        time: "10:05",
    },
    {
        id: 5,
        sender: "other",
        content: "Wow that's great",
        time: "10:06",
        avatar: users[0].avatar,
    }
];
