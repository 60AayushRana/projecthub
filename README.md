# ProjectHub - Full-Stack Project Management App

React + Node.js + MongoDB project management app with role-based access control.

## Tech Stack

- **Frontend**: React 18, Tailwind CSS, Recharts, React Router v6
- **Backend**: Node.js, Express.js, MongoDB (Mongoose)
- **Auth**: JWT + bcrypt
- **File uploads**: Multer

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

App runs at `http://localhost:3000`, API at `http://localhost:5000`.

## Environment Variables (backend/.env)

| Variable     | Description                        |
|--------------|------------------------------------|
| PORT         | Server port (default 5000)         |
| MONGO_URI    | MongoDB connection string          |
| JWT_SECRET   | Secret key for JWT signing         |
| JWT_EXPIRE   | Token expiry (default 7d)          |
| CLIENT_URL   | Frontend URL for CORS              |

## Features

- **Auth**: Register/Login/Logout with JWT, password hashing
- **RBAC**: Admin (full access) / Member (view + update own tasks)
- **Projects**: Create, edit, delete, filter, search, pagination
- **Tasks**: Kanban board, status updates, overdue tracking, file attachments
- **Comments**: Per-task comment threads
- **Dashboard**: Stats, charts (bar + pie), team performance, activity feed
- **Dark mode**: Toggle via topbar
- **Team management**: Admin can manage users and roles

## API Endpoints

| Method | Endpoint                        | Description              |
|--------|---------------------------------|--------------------------|
| POST   | /api/auth/register              | Register user            |
| POST   | /api/auth/login                 | Login                    |
| GET    | /api/auth/me                    | Get current user         |
| GET    | /api/projects                   | List projects            |
| POST   | /api/projects                   | Create project (admin)   |
| GET    | /api/projects/:id               | Get project              |
| PUT    | /api/projects/:id               | Update project (admin)   |
| DELETE | /api/projects/:id               | Delete project (admin)   |
| POST   | /api/projects/:id/members       | Add member (admin)       |
| DELETE | /api/projects/:id/members/:uid  | Remove member (admin)    |
| GET    | /api/tasks                      | List tasks               |
| POST   | /api/tasks                      | Create task (admin)      |
| PUT    | /api/tasks/:id                  | Update task              |
| DELETE | /api/tasks/:id                  | Delete task (admin)      |
| GET    | /api/comments?task=             | Get task comments        |
| POST   | /api/comments                   | Post comment             |
| GET    | /api/dashboard/stats            | Dashboard stats          |
| GET    | /api/dashboard/project-progress | Project progress chart   |
| GET    | /api/dashboard/task-status      | Task status pie chart    |
| GET    | /api/dashboard/user-performance | Team performance         |
| GET    | /api/dashboard/activity         | Activity feed            |

## Deployment

### Render (Backend)
1. Push to GitHub
2. Create Web Service on Render, point to `backend/`
3. Set environment variables
4. Build command: `npm install`, Start: `npm start`

### Vercel (Frontend)
1. Create project on Vercel, point to `frontend/`
2. Set `REACT_APP_API_URL` to your Render backend URL
3. Deploy
