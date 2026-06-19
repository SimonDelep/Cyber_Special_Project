# VistaCanvas

E-commerce platform for high-quality, print-on-demand landscape wall art, moody vintage prints, and framed canvas gallery sets.

## Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| API      | FastAPI (Python)                    |
| ORM      | SQLAlchemy                          |
| Database | PostgreSQL                          |
| Frontend | React + TypeScript + Vite           |
| Styling  | Tailwind CSS v4                     |

## Project structure

```
VistaCanvas/
├── backend/
│   ├── app/
│   │   ├── api/routes/     # API endpoints
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   ├── scripts/seed.py     # Sample product data
│   └── requirements.txt
├── frontend/
│   └── src/
│       └── components/     # React UI
├── docker-compose.yml      # Local PostgreSQL
└── README.md
```

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for PostgreSQL)
- Python 3.11+
- Node.js 20+

## Quick start

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
python scripts/seed.py
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API: http://localhost:8000  
Health: http://localhost:8000/api/health  
Docs: http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

## Environment variables

Copy `backend/.env.example` to `backend/.env`:

| Variable       | Default                                              |
| -------------- | ---------------------------------------------------- |
| `DATABASE_URL` | `postgresql+psycopg://vistacanvas:vistacanvas@localhost:5432/vistacanvas` |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173`        |

## Authentication

| Endpoint | Method | Description |
| -------- | ------ | ----------- |
| `/api/auth/register` | POST | Create account (auto-login) |
| `/api/auth/login` | POST | Sign in (sets session cookie) |
| `/api/auth/logout` | POST | End current session |
| `/api/auth/me` | GET | Current user |
| `/api/auth/sessions` | GET | List active sessions |
| `/api/profile/me` | GET/PUT/DELETE | View, update, or delete profile |
| `/api/profile/me/avatar` | POST | Upload profile image |
| `/api/profile/me/avatar-url` | PUT | Set profile image URL |
| `/api/admin/users` | GET | List users (admin only) |
| `/api/admin/users/{id}` | GET/PUT | View or update a user |
| `/api/admin/users/{id}/balance` | PATCH | Adjust balance (delta or set) |
| `/api/admin/products` | GET/POST | List or create products |
| `/api/admin/products/{id}` | GET/PUT/DELETE | Manage a product |
| `/api/admin/products/import-csv/sample` | GET | Download sample CSV template (admin) |
| `/api/admin/products/import-csv` | POST | Bulk-create products from CSV upload (admin) |
| `/api/checkout` | POST | Simulate checkout (creates order + invoice number) |
| `/api/orders/me` | GET | List your past orders |
| `/api/orders/{id}/invoice` | GET | Download order invoice as PDF |
| `/api/inspiration` | GET | Live landscape feed (NASA APOD, Open-Meteo, Picsum, ZenQuotes) |
| `/api/admin/events` | GET | System event log (admin only; filter by type, status, user) |

**Admin panel:** http://localhost:5173/admin (admin role required). **System log** tab shows login attempts, profile changes, checkouts, and admin actions.

**Event logging:** Auth, profile, checkout, and admin routes write to the `system_events` table (no passwords stored).

Sessions use an HTTP-only cookie (`vistacanvas_session`). Roles: `user` and `admin`.

**Default admin** (created by seed): username `admin`, password `admin12345`

Frontend routes: `/login`, `/register`, `/profile`, `/cart`, `/catalog`, `/catalog/:slug`

**Catalog:** Search, filter by category/price, sort results. Product detail pages include customer reviews.

**Reviews:** Logged-in users can post one review per product (rating, title, text, optional image via URL or file upload).

**Cart & checkout:** Add items from the catalog, open `/cart`, and run **Complete checkout (simulation)**. The API validates your balance server-side; insufficient funds return an error without changing the balance. After a successful checkout, use **Download invoice (PDF)** to save your invoice (`VC-YYYY-######`).

Install PDF support: `pip install reportlab` (listed in `backend/requirements.txt`).

## Next steps

- User accounts and orders
- Image uploads and print-on-demand provider integration
