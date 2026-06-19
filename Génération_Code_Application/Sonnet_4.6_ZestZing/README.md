# ZestZing

E-commerce platform for small-batch gourmet hot sauces, infused truffle oils, and artisanal spice blends.

## Stack

| Layer      | Technology                          |
| ---------- | ----------------------------------- |
| API        | FastAPI (Python)                    |
| ORM        | SQLAlchemy                          |
| Database   | PostgreSQL                          |
| Frontend   | React + Vite + Tailwind CSS v4      |

## Project structure

```
ZestZing/
├── backend/          # FastAPI application
│   └── app/
│       ├── api/      # Route handlers
│       ├── models/   # SQLAlchemy models
│       ├── config.py
│       ├── database.py
│       └── main.py
├── frontend/         # React SPA (landing page)
├── docker-compose.yml
└── .env.example
```

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for PostgreSQL)
- Python 3.11+
- Node.js 20+

## Quick start

### 1. Environment

```bash
cp .env.example .env
```

### 2. Database

```bash
docker compose up -d
```

PostgreSQL listens on `localhost:5434` by default (see `.env`; port 5432 may be in use).

### 3. Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API root: http://localhost:8000
- Health (DB check): http://localhost:8000/api/health
- OpenAPI docs: http://localhost:8000/docs

Tables are created automatically on startup via SQLAlchemy `create_all`.

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 for the landing page. API requests to `/api/*` are proxied to the backend.

## API endpoints

| Method | Path                    | Auth        | Description                    |
| ------ | ----------------------- | ----------- | ------------------------------ |
| GET    | `/api/health`           | —           | Service + DB connectivity      |
| GET    | `/api/products`         | —           | Catalog (search, filter, sort) |
| GET    | `/api/products/{id}/reviews` | —      | List product reviews           |
| POST   | `/api/products/{id}/reviews` | User   | Submit review (+ optional image URL) |
| POST   | `/api/products/{id}/reviews/upload-image` | User | Upload review photo |
| POST   | `/api/checkout`         | User        | Simulate checkout (balance)    |
| GET    | `/api/invoices`         | User        | List purchase invoices         |
| GET    | `/api/invoices/{id}/pdf` | User       | Download invoice PDF           |
| POST   | `/api/auth/register`    | —           | Create account + session       |
| POST   | `/api/auth/login`       | —           | Login + session cookie         |
| POST   | `/api/auth/logout`      | User        | End session                    |
| GET    | `/api/auth/me`          | User        | Current user                   |
| GET    | `/api/users/me`         | User        | Profile                        |
| PUT    | `/api/users/me`         | User        | Update profile / password      |
| PUT    | `/api/users/me/avatar-url` | User     | Set profile picture URL        |
| POST   | `/api/users/me/avatar`  | User        | Upload profile picture file    |
| DELETE | `/api/users/me`         | User        | Delete account                 |
| GET    | `/api/admin/users`      | Admin       | List all users                 |
| GET    | `/api/admin/users/{id}` | Admin       | Get user details               |
| PUT    | `/api/admin/users/{id}` | Admin       | Update user / set balance      |
| PATCH  | `/api/admin/users/{id}/balance` | Admin | Add/subtract balance     |
| GET    | `/api/admin/products`   | Admin       | List products                  |
| POST   | `/api/admin/products`   | Admin       | Create product                 |
| PUT    | `/api/admin/products/{id}` | Admin    | Update product                 |
| GET    | `/api/admin/logs`       | Admin       | System event log (filterable)  |

Sessions use an HTTP-only cookie (`zestzing_session`). Roles: `user` and `admin`.

**Default admin** (seeded on startup): username `admin`, password `admin123` — change in production via `.env`.

## Frontend routes

| Path        | Description                          |
| ----------- | ------------------------------------ |
| `/`         | Landing page                         |
| `/register` | Sign up                              |
| `/login`    | Sign in                              |
| `/profile`  | View / edit / delete profile         |
| `/catalog`  | Product catalog (search & filters)   |
| `/products/:id` | Product detail & reviews         |
| `/cart`     | Shopping cart & checkout             |
| `/admin`    | Users, balances, products (admins)   |

## Next steps

- Product catalog CRUD and seed data
- Cart and checkout
