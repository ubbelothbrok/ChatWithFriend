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

## 🔐 Access Control

To join the chat, you need the **Access Key**.
- **Key**: `ashu`

## 🌍 Deployment

Since this app uses WebSockets, we use a split deployment strategy.

### 1. Backend (Render)
1. Go to [Render](https://render.com) and create a **Web Service**.
2. **Root Directory**: `backend`
3. **Build Command**: `./build.sh`
4. **Start Command**: `daphne -b 0.0.0.0 -p $PORT chat_project.asgi:application`
5. **Envs**: Set `SECRET_KEY`, `DEBUG=False`, and `ALLOWED_HOSTS`.

### 2. Frontend (Vercel)
1. Go to [Vercel](https://vercel.com) and import the repo.
2. **Root Directory**: `frontend`
3. **Envs**: Set `VITE_WS_URL` to your Render backend URL (e.g., `wss://your-app.onrender.com/ws/chat/`).

---

## 💡 Hybrid Setup (Local vs Production)

The project is designed to run in both environments without manual code changes:

- **Local**: If no environment variables are found, the backend defaults to `DEBUG=True` and SQLite. The frontend defaults to `ws://localhost:8000`.
- **Production**: When deployed, it uses environment variables for security and connects to the production WebSocket URL.

## 🎮 Usage

### Local Development
1. **Start Backend**:
   ```bash
   cd backend && source venv/bin/activate.fish && python manage.py runserver 8000
   ```
2. **Start Frontend**:
   ```bash
   cd frontend && npm run dev
   ```

### Accessing from other devices
To test on your phone in the same network:
1. Run backend with `0.0.0.0`:
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```
2. Access via your computer's IP address.

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

