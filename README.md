# Chat With Friend

A real-time chat application built with Django (backend) and React (frontend) using WebSockets for instant messaging.

## 🚀 Features

- **Real-time messaging** - Messages broadcast instantly to all connected users
- **Message persistence** - All messages saved to database
- **Open access** - Anyone can join with just a username
- **Connection status** - Visual indicator shows connection state
- **Message grouping** - Consecutive messages from same sender are grouped together
- **Responsive design** - Works on mobile and desktop

## 🛠️ Tech Stack

### Backend
- Django 6.0
- Django Channels (WebSockets)
- Daphne (ASGI server)
- SQLite database

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS

## 📋 Prerequisites

- Python 3.14+ installed
- Node.js and npm installed
- Fish shell (or bash/zsh - adjust activation commands accordingly)

## 🔧 Installation & Setup

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate.fish  # For fish shell
   # OR
   source venv/bin/activate        # For bash/zsh
   ```

3. **Install dependencies**
   ```bash
   pip install django channels daphne django-cors-headers
   ```

4. **Run migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Start the backend server**
   ```bash
   python manage.py runserver 8000
   ```

   Backend will be running at `http://localhost:8000`
   WebSocket endpoint: `ws://localhost:8000/ws/chat/`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

   Frontend will be running at `http://localhost:5173`

## 🎮 Usage

1. **Start the backend server** (in one terminal)
   ```bash
   cd backend
   source venv/bin/activate.fish
   python manage.py runserver 8000
   ```

2. **Start the frontend server** (in another terminal)
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open your browser**
   - Go to `http://localhost:5173`
   - Enter your name to join the chat
   - Start messaging!

4. **Test real-time messaging**
   - Open the app in multiple browser tabs/windows
   - Enter different usernames
   - Send messages and watch them appear in real-time across all windows

## 📁 Project Structure

```
ChatWithFriend/
├── backend/
│   ├── chat/                    # Chat app
│   │   ├── models.py           # Message model
│   │   ├── consumers.py        # WebSocket handler
│   │   ├── routing.py          # WebSocket URL routing
│   │   └── migrations/
│   ├── chat_project/           # Django project settings
│   │   ├── settings.py         # Channels, CORS, DB config
│   │   ├── asgi.py             # ASGI configuration
│   │   └── urls.py
│   ├── db.sqlite3              # SQLite database
│   ├── manage.py
│   └── venv/                   # Virtual environment
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── ChatWindow.tsx  # Main chat component
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts # WebSocket connection hook
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

## 🔌 WebSocket API

### Connect
```
ws://localhost:8000/ws/chat/
```

### Send Message
```json
{
  "sender": "username",
  "message": "Hello everyone!"
}
```

### Receive Message
```json
{
  "sender": "username",
  "message": "Hello everyone!"
}
```

## 🐛 Troubleshooting

### Backend Issues

- **Port already in use**: Change port with `python manage.py runserver 8001`
- **Module not found**: Make sure virtual environment is activated and dependencies installed
- **Database errors**: Run `python manage.py migrate` again

### Frontend Issues

- **Port in use**: Kill the process or Vite will auto-suggest another port
- **WebSocket connection failed**: Make sure backend is running on port 8000
- **Module errors**: Delete `node_modules` and run `npm install` again

## 🚀 Future Enhancements

- [ ] User authentication
- [ ] Private messaging
- [ ] Message history on join
- [ ] Typing indicators
- [ ] Read receipts
- [ ] File/image sharing
- [ ] Emoji support
- [ ] Deploy to production

## 📝 License

This project is open source and available under the MIT License.

