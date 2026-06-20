# GamerGrid

E-commerce platform for **ergonomic mechanical keyboards**, **precision gaming mice**, and **customizable RGB desk mats**.

## Stack

| Layer    | Technology              |
| -------- | ----------------------- |
| API      | FastAPI (Python)        |
| ORM      | SQLAlchemy              |
| Database | PostgreSQL              |
| Frontend | React + Vite            |
| Styling  | Tailwind CSS v4         |

## Project structure

```
├── backend/           # FastAPI application
│   └── app/
│       ├── api/       # Route handlers
│       ├── models/    # SQLAlchemy models
│       ├── schemas/   # Pydantic schemas
│       ├── config.py
│       ├── database.py
│       ├── main.py
│       └── seed.py
├── frontend/          # React SPA
│   └── src/
│       ├── api/
│       ├── components/
│       ├── contexts/  # Auth & cart state
│       ├── pages/
│       └── types/
├── docker-compose.yml # Local PostgreSQL
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

PostgreSQL listens on `localhost:5433` (host port; container uses 5432) with user/password/database `gamergrid`. If port 5432 is already in use on your machine, we map to 5433 to avoid conflicts.

### 2. Run the API

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # skip if .env already exists
uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

The Vite dev server proxies `/api` to `http://127.0.0.1:8001` (see `frontend/vite.config.ts`). Use the same port when running uvicorn locally.

API docs: [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs)

On first startup, tables are created and sample products are seeded.

### 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Routes: home, `/catalog`, `/products/:id`, `/cart`, `/login`, `/register`.

## Features

- **Landing page** with categories, a searchable product catalog section, and a random quote (external API)
- **Product catalog** (`/catalog`) — search, category, price range, and sort filters
- **Product detail** pages with add-to-cart and customer reviews (optional photo via URL or file upload)
- **Shopping cart** — guest cart in `localStorage`; server cart when signed in (merged on login)
- **Auth** — JWT register/login, protected cart API
- **Admin account** — seeded on API startup (see env vars below)
- **Admin panel** — `/admin` — manage users, balances, products (including **CSV bulk import**), and **system event logs** (auth, profile, checkout)
- **Checkout** — pay with account balance (wallet); order history at `/orders`; **PDF invoice download** per order

## API endpoints

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/api/health` | | Health check |
| GET | `/api/quote` | | Random quote (proxied from [DummyJSON](https://dummyjson.com/docs/quotes)) |
| GET | `/api/products` | | List products (`search`, `category`, `min_price_cents`, `max_price_cents`, `sort`) |
| GET | `/api/products/{id}` | | Product detail |
| GET | `/api/products/{id}/reviews` | | List reviews |
| POST | `/api/products/{id}/reviews` | ✓ | Submit review (multipart: rating, title, body, optional `image_url` or `image_file`) |
| PATCH | `/api/products/{id}/reviews/mine` | ✓ | Update your review |
| DELETE | `/api/products/{id}/reviews/mine` | ✓ | Delete your review |
| POST | `/api/auth/register` | | Create account |
| POST | `/api/auth/login` | | Sign in |
| GET | `/api/auth/me` | ✓ | Current user |
| GET | `/api/cart` | ✓ | Get cart |
| POST | `/api/cart/items` | ✓ | Add item |
| PATCH | `/api/cart/items/{id}` | ✓ | Update quantity |
| DELETE | `/api/cart/items/{id}` | ✓ | Remove item |
| POST | `/api/cart/merge` | ✓ | Merge guest cart |
| GET | `/api/admin/users` | Admin | List users |
| PATCH | `/api/admin/users/{id}` | Admin | Update user / balance |
| GET | `/api/admin/products` | Admin | List products |
| POST | `/api/admin/products` | Admin | Create product |
| POST | `/api/admin/products/import` | Admin | Bulk create products from CSV (`file` upload) |
| PATCH | `/api/admin/products/{id}` | Admin | Update product |
| DELETE | `/api/admin/products/{id}` | Admin | Delete product |
| GET | `/api/admin/logs` | Admin | System event log (filter by `event_type`, `severity`, pagination) |
| POST | `/api/checkout` | ✓ | Place order (deduct balance, clear cart) |
| GET | `/api/orders` | ✓ | Order history |
| GET | `/api/orders/{id}` | ✓ | Order details |
| GET | `/api/orders/{id}/invoice` | ✓ | Download order invoice (PDF) |

## Environment variables

Copy `backend/.env.example` to `backend/.env`:

| Variable | Default |
| -------- | ------- |
| `DATABASE_URL` | `postgresql+psycopg://gamergrid:gamergrid@localhost:5433/gamergrid` |
| `CORS_ORIGINS` | `http://localhost:5173` |
| `JWT_SECRET` | Change in production |
| `JWT_EXPIRE_MINUTES` | `10080` (7 days) |
| `ADMIN_EMAIL` | `admin@gamergrid.com` |
| `ADMIN_PASSWORD` | `GamerGridAdmin123!` (change in production) |
| `ADMIN_FULL_NAME` | `GamerGrid Admin` |

On startup, if no user exists with `ADMIN_EMAIL`, an admin account is created automatically. Sign in at `/login` with those credentials.

## License

Academic / project use — UQAC Projet Spécial Cyber.
