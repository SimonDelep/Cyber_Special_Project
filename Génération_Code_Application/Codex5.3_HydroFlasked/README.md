# HydroFlasked

E-commerce site for premium stainless steel travel tumblers, custom glassware, and insulated wine mugs.

## Stack

- **Next.js** (App Router) + **React** + **TypeScript**
- **Tailwind CSS** v4
- **Prisma** + **PostgreSQL**

## Project structure

```
src/
  app/              # Routes, API routes, global styles
  components/
    auth/           # Login, register, avatar
    profile/        # Profile form
    layout/         # Header, Footer
    landing/        # Landing page sections
  lib/
    auth/           # Sessions, passwords, RBAC, validation
prisma/
  schema.prisma     # User, Session, Product models
  seed.ts           # Sample products + admin user
generated/prisma/   # Prisma Client (generated)
public/uploads/avatars/  # Uploaded profile pictures
```

## Authentication & RBAC

- **Register** `/register` — username/password (bcrypt-hashed), optional display name and email
- **Login** `/login` — creates a 7-day HTTP-only session cookie
- **Logout** — clears server session and cookie (header button)
- **Profile** `/profile` — view/edit display name, email, avatar (URL or file upload), change password, delete account
- **Roles:** `USER` (default) and `ADMIN` (admin-only `/admin` dashboard)

Seeded administrator (change in production):

| Username | Password   | Role  |
|----------|------------|-------|
| `admin`  | `admin1234` | ADMIN |

## Admin panel (`/admin`)

Administrators can:

- **Users** — view all accounts, edit display name, email, role, profile image URL, set balance (CAD), quick +$10/−$10 adjustments, delete users
- **Products** — create, edit, and delete catalog items; **bulk import from CSV** (sample: `/samples/products-import-sample.csv`)
- **System log** — internal audit trail (search, filter by category/status, pagination)

All admin API routes under `/api/admin/*` require an active `ADMIN` session.

## Event logging & monitoring

User actions are recorded in PostgreSQL (`SystemLog`) via `logEvent()` in `src/lib/audit/logger.ts`:

| Category      | Events logged |
|---------------|---------------|
| **AUTH**      | Login (success/failure), register, logout |
| **PROFILE**   | Profile update, account delete, avatar upload |
| **TRANSACTION** | Checkout requests (success, insufficient balance, validation errors) |
| **ADMIN**     | User edits/deletes, balance adjustments, product CRUD |

Each entry stores action id, status, message, user, IP, user agent, and optional JSON metadata. View logs in the admin panel **System log** tab or `GET /api/admin/logs`.

## Open API — live weather (landing page)

The home page includes a **Hydration & weather** panel powered by [Open-Meteo](https://open-meteo.com/) (free, no API key):

- Default location: Saguenay (Chicoutimi) — change in `src/lib/open-meteo.ts`
- **`GET /api/weather?latitude=&longitude=&label=`** — proxy for client geolocation updates
- Temperature, humidity, conditions, and a drinkware-themed hydration tip

## Product catalog & reviews

- **`/shop`** — full catalog with search, category filter, price range, in-stock filter, and sort options (landing page links here)
- **`/shop/[slug]`** — product detail with customer reviews
- **Reviews** — signed-in users can submit one review per product (rating, title, text, optional photo via URL or file upload)
- **`GET/POST /api/products/[productId]/reviews`** — list and upsert reviews
- **`POST /api/products/[productId]/reviews/image`** — upload review photo (max 2 MB)

## Shopping cart & checkout

- **`/shop`** — browse products and add to cart (saved in browser storage)
- **`/cart`** — review cart, see balance vs. total, complete simulated checkout
- **`POST /api/checkout`** — validates stock, checks `balanceCents`, deducts total, creates an `Order`, returns `order.id` and `invoiceNumber`
- **`GET /api/invoices/[orderId]/pdf`** — download a PDF invoice (owner or admin only)

After checkout, use **Download invoice (PDF)** on the cart success screen or from **Profile → Purchase history**.

Admins can top up user balances in the admin panel for testing checkout.

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment

Copy the example env file and adjust if needed:

```bash
copy .env.example .env
```

On macOS/Linux: `cp .env.example .env`

### 3. Start PostgreSQL (Docker)

```bash
npm run db:up
```

### 4. Apply schema and seed data

```bash
npm run db:migrate
npm run db:seed
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Useful scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Next.js development server |
| `npm run build` | Production build |
| `npm run db:up` | Start Postgres via Docker |
| `npm run db:down` | Stop Postgres container |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed sample products |
| `npm run db:studio` | Open Prisma Studio |

## Database without Docker

Point `DATABASE_URL` in `.env` to any PostgreSQL instance, then run `npm run db:migrate` and `npm run db:seed`.

> **Note:** Docker Compose exposes Postgres on port **5433** (not 5432) to avoid conflicts with an existing local PostgreSQL install.
