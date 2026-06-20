# AuraWear

E-commerce platform for modern clothing. Built with **FastAPI**, **React**, **Tailwind CSS**, **PostgreSQL**, and **SQLAlchemy**.

## Project structure

```
AuraWear/
├── backend/          # FastAPI API
│   └── app/
│       ├── api/      # Route handlers
│       ├── core/     # Config, database
│       └── models/   # SQLAlchemy models
├── frontend/         # React + Vite + Tailwind
├── docker-compose.yml
└── README.md
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- Docker (for PostgreSQL)

## Quick start

### 1. Database

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
cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API: http://localhost:8000  
Docs: http://localhost:8000/docs  
Health: http://localhost:8000/api/health

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

## Tech stack

| Layer    | Technology        |
|----------|-------------------|
| API      | FastAPI           |
| ORM      | SQLAlchemy 2.0    |
| Database | PostgreSQL 16     |
| UI       | React 18 + Vite   |
| Styling  | Tailwind CSS 3    |

## Authentication & users

Server-side sessions (HttpOnly cookie), username/password auth, and RBAC (`user` | `admin`).

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/register` | Create account (auto login) |
| `POST /api/auth/login` | Login |
| `POST /api/auth/logout` | Logout |
| `GET /api/auth/me` | Current user |
| `GET/PATCH /api/users/me` | Profile read/update |
| `PATCH /api/users/me/password` | Change password |
| `DELETE /api/users/me` | Delete account (password required) |
| `GET /api/admin/users` | List users (admin only) |
| `PATCH /api/admin/users/{id}` | Update user profile & role |
| `PATCH /api/admin/users/{id}/balance` | Adjust or set wallet balance |
| `GET/POST /api/admin/products` | List / create products |
| `PATCH/DELETE /api/admin/products/{id}` | Update / delete products |
| `GET /api/admin/events` | System event log (admin only, filterable) |

Default admin (seeded on startup if not present): `admin` / `changeme` — set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `backend/.env`.

Frontend routes: `/catalog`, `/catalog/:productId`, `/login`, `/register`, `/profile`, `/cart`, `/admin` (tabs: Users, Products, System log).

## Event logging

Server-side audit trail stored in PostgreSQL (`system_events`). Intercepts login attempts, registration, logout, profile updates, password changes, account deletion, checkout (success/failure), and admin balance/user changes. View logs under **Admin → System log**.

## Product catalog

`GET /api/products` supports query filters: `q`, `category`, `min_price`, `max_price`, `sort` (`newest`, `oldest`, `price_asc`, `price_desc`, `name_asc`, `name_desc`).  
`GET /api/products/categories` returns distinct categories.  
`GET /api/products/{id}` returns a single active product.

## Reviews

Authenticated users can post one review per product (`POST /api/products/{id}/reviews`). Reviews support an optional image via external URL or file upload (`POST /api/reviews/upload`, max 5 MB, JPEG/PNG/WebP/GIF). Uploaded files are served from `/api/uploads/`.

## Shopping cart & checkout

Cart is stored in the browser (`localStorage`). Checkout (`POST /api/checkout`) requires sign-in, validates stock, compares wallet balance to the order total, and on success debits the user and reduces product stock.

## Next steps

- Alembic migrations
- Order history
