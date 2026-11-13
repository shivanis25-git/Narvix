# Narvix

### A Collaborative Workspace for Developers

Narvix is a developer collaboration platform that brings project management, team collaboration, documentation, file management, and AI-powered development assistance together in one workspace.

## ✨ Features

- **User Authentication** – Secure registration and login using JWT and password hashing.
- **Project Management** – Create and manage development projects.
- **Team Collaboration** – Add members and collaborate on projects.
- **Notes & Documentation** – Create and manage Markdown-based notes.
- **AI Assistant** – Get AI-powered assistance for development tasks.
- **Code Explainer** – Understand code with AI assistance.
- **Documentation Generator** – Generate project documentation.
- **README Generator** – Generate README content for projects.
- **File Manager** – Upload, manage, and preview project files.
- **Analytics Dashboard** – View project and workspace statistics.
- **Public Sharing** – Share read-only project content through public links.

## 🛠️ Tech Stack

### Frontend
- React 19
- Vite
- React Markdown
- Remark GFM
- CSS

### Backend
- Node.js
- Express.js 5
- MongoDB
- Mongoose
- JSON Web Tokens (JWT)
- Bcrypt
- Multer

### AI & Integrations
- Google Gemini API
- Google Authentication
- Resend Email API

## 📁 Project Structure

```text
Narvix/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js
- npm
- MongoDB Atlas account
- Google Gemini API key

### 1. Clone the Repository

```bash
git clone https://github.com/shivanis25-git/Narvix.git
cd Narvix
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the backend directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CLIENT_ID=your_google_client_id
FRONTEND_URL=http://localhost:5173
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=your_verified_sender_email
```

Start the backend:

```bash
npm run dev
```

### 3. Frontend Setup

Open another terminal:

```bash
cd Narvix/frontend
npm install
```

Create a `.env` file inside the frontend directory:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Start the frontend:

```bash
npm run dev
```

Open the local URL displayed by Vite in your browser.

## 🔐 Environment Variables

Keep all API keys, database credentials, and authentication secrets private.

Never upload `.env` files or expose secret keys in frontend code.

## 🌐 Deployment

Deployment configuration:

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas

Live application links will be added after deployment.

## 📌 Future Scope

- Further improvements to collaboration workflows.
- Additional AI-powered developer tools.
- Enhanced workspace analytics.