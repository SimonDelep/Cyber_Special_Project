# PureRoots

E-commerce for sustainable everyday essentials: biodegradable bamboo toothbrushes, zero-waste shampoo bars, and refillable household cleaners.

## Stack

- **Backend:** FastAPI, SQLAlchemy, PostgreSQL
- **Frontend:** React, Vite, Tailwind CSS

## Project structure

```
PureRoots/
├── backend/          # FastAPI API
├── frontend/         # React SPA
├── docker-compose.yml
└── README.md
```

## Quick start

### Prerequisites

- Docker & Docker Compose (for PostgreSQL)
- Python 3.11+
- Node.js 20+

### 1. Database

```bash
docker compose up -d db
```

PostgreSQL runs on `localhost:5432` (user `pureroots`, password `pureroots`, database `pureroots`). Start Docker Desktop before running `docker compose up -d db`.

### 2. Backend

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
# source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

API: http://localhost:8000  
Docs: http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://127.0.0.1:5173 (or http://localhost:5173)

### Start everything (Windows)

```powershell
.\scripts\start.ps1
```

Or run each service manually (see sections above). If port 8000 is busy, stop old terminals or run `Get-NetTCPConnection -LocalPort 8000 | Select OwningProcess`.

## Authentication & users

- **Register / login / logout** at `/register` and `/login` (session cookie, server-side sessions).
- **Profile** at `/profile` — edit email, name, bio, phone, password; avatar via URL or file upload.
- **RBAC** — roles `user` and `admin`; admins use `/admin` to manage users, balances, and products.
- **Catalog** — `/catalog` with search, category, price filters, and sorting.
- **Reviews** — signed-in users can review products on each product page (image via URL or upload).
- **Seed admin:** username `admin`, password `admin123` (change in production).

## Environment

Copy `backend/.env.example` to `backend/.env` and adjust if needed. Set `SECRET_KEY` in production. The frontend proxies `/api` and `/uploads` to the backend during development (see `frontend/vite.config.ts`).
