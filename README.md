# Dorm-Gourmet

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+ and npm
- A MongoDB instance (local or Atlas)

### 1. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure the backend

Copy the example env file and fill in your values:

```bash
cd backend
cp .env.example .env
```

| Variable         | Description                              |
| ---------------- | ---------------------------------------- |
| `MONGO_URI`      | MongoDB connection string                |
| `DB_NAME`        | Name of the database to use              |
| `SESSION_SECRET` | Long random string used to sign sessions |

### 3. Run both dev servers

Use two terminals:

```bash
# Terminal 1 — backend (http://localhost:3000, auto-restarts via nodemon)
cd backend
npm run dev
```

```bash
# Terminal 2 — frontend (Vite, http://localhost:5173)
cd frontend
npm run dev
```

The Vite dev server proxies any `/api` request to the backend on port 3000, so the frontend can call e.g. `fetch("/api/health")` directly. Visit http://localhost:5173/api/health to check the backend is reachable through the proxy.

### Linting & formatting

Each half has its own ESLint flat config (`eslint.config.js`) and Prettier. Run these from inside `backend/` or `frontend/`:

```bash
npm run lint      # ESLint (frontend includes React + Hooks rules)
npm run format    # Prettier, rewrites files in place
```
