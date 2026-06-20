# SproutSoil

E-commerce platform for smart indoor herb garden kits, self-watering ceramic planters, and specialized plant nutrient mists.

## Stack

| Layer    | Technology                          |
| -------- | ------------------------------------- |
| Backend  | FastAPI, SQLAlchemy, Pydantic         |
| Frontend | React, Vite, Tailwind CSS v4          |
| Database | PostgreSQL 16                         |

## Project Structure

```
SproutSoil/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app entry point
│   │   ├── config.py        # Environment settings
│   │   ├── database.py      # SQLAlchemy engine & session
│   │   ├── models/          # Database models
│   │   ├── schemas/         # Pydantic schemas
│   │   └── routers/         # API route handlers
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/      # React UI components
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── docker-compose.yml       # PostgreSQL container
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- Docker Desktop (for PostgreSQL)

### 1. Start the database

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # skip if .env already exists
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Landing page: http://localhost:5173

## API Endpoints

| Method | Path                              | Description                    |
| ------ | --------------------------------- | ------------------------------ |
| GET    | `/api/health`                     | Health check + DB ping         |
| GET    | `/api/products`                   | List all products              |
| POST   | `/api/auth/register`              | Register (creates session)     |
| POST   | `/api/auth/login`                 | Login (creates session)        |
| POST   | `/api/auth/logout`                | Logout (ends session)          |
| GET    | `/api/auth/me`                    | Current user                   |
| GET    | `/api/users/me`                   | Profile                        |
| PUT    | `/api/users/me`                   | Update profile                 |
| PUT    | `/api/users/me/profile-picture-url` | Set avatar from URL          |
| POST   | `/api/users/me/profile-picture`   | Upload avatar file             |
| DELETE | `/api/users/me`                   | Delete own account             |
| GET    | `/api/admin/users`                | List users (admin only)        |
| GET    | `/api/admin/users/{id}`           | Get user (admin only)          |
| PUT    | `/api/admin/users/{id}`           | Update user (admin only)       |
| PATCH  | `/api/admin/users/{id}/balance`   | Set or adjust balance          |
| GET    | `/api/admin/products`             | List products (admin only)     |
| POST   | `/api/admin/products`             | Create product (admin only)    |
| PUT    | `/api/admin/products/{id}`        | Update product (admin only)    |
| DELETE | `/api/admin/products/{id}`        | Delete product (admin only)    |

**Default admin:** `admin` / `admin12345` (change via `ADMIN_USERNAME` / `ADMIN_PASSWORD` in `.env`)

## Environment Variables

Copy `backend/.env.example` to `backend/.env`:

| Variable       | Default                                                          |
| -------------- | ---------------------------------------------------------------- |
| `DATABASE_URL` | `postgresql+psycopg://sproutsoil:sproutsoil@localhost:5432/sproutsoil` |
| `CORS_ORIGINS` | `http://localhost:5173`                                          |
