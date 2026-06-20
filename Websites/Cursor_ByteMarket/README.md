# ByteMarket

E-commerce storefront for electronics — CPUs, GPUs, peripherals, storage, and networking gear.

## Stack

| Layer | Technology |
|-------|------------|
| Framework | [Astro 5](https://astro.build/) (SSR) |
| UI islands | [SolidJS](https://www.solidjs.com/) |
| State | [Nanostores](https://github.com/nanostores/nanostores) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Database | SQLite ([better-sqlite3](https://github.com/WiseLibs/better-sqlite3)) + [Drizzle ORM](https://orm.drizzle.team/) |
| Auth | Username/password, HTTP-only session cookies, RBAC |

## Project structure

```
src/
├── components/
│   ├── auth/         # AuthCard, FormField
│   ├── layout/       # Header, Footer
│   ├── landing/      # Hero, categories, products
│   └── solid/        # Cart islands
├── db/               # Schema + SQLite client
├── lib/
│   ├── auth/         # Password, sessions, users, RBAC
│   └── admin/        # Product CRUD helpers
├── middleware.ts     # Session + route protection
├── pages/
│   ├── api/auth/     # login, register, logout
│   ├── api/profile/  # update, delete, avatar
│   ├── api/admin/    # users + products management
│   ├── login.astro
│   ├── register.astro
│   ├── profile.astro
│   └── admin/
├── stores/           # Nanostores (cart)
└── styles/
drizzle/migrations/
scripts/
data/                 # Local SQLite (gitignored)
```

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `DATABASE_PATH` | SQLite file path (default: `./data/bytemarket.db`) |
| `SESSION_SECRET` | Reserved for future signed cookies (change in production) |

### 3. Initialize the database

```bash
npm run db:setup
```

Runs migrations and seeds categories, products, and a default **admin** account.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:4321](http://localhost:4321).

## Authentication

| Route | Description |
|-------|-------------|
| `/register` | Create account (username + password) |
| `/login` | Sign in; active session via HTTP-only cookie |
| `POST /api/auth/logout` | End session (Sign out button in header) |
| `/profile` | View, edit, or delete your profile |
| `/catalog` | Product catalog with search and filters |
| `/catalog/[slug]` | Product detail, reviews, add to cart |
| `/admin` | Admin dashboard (overview) |
| `/admin/users` | List, create, and edit users |
| `/admin/products` | List, create, and edit products |

### Default admin (dev seed)

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin12345` |

Register additional users at `/register` — they receive the `user` role by default.

### Admin panel

Administrators can:

- **Users** — create accounts, edit profile/email/password, change roles, delete users, and adjust store credit (`balance_cents` in CAD).
- **Products** — create and update catalog items (slug, price, stock, category, featured flag).
- **CSV import** (`/admin/products/import`) — bulk-create products; sample file at `/samples/products-import-sample.csv`.
- **System log** (`/admin/logs`) — internal audit trail for logins, profile changes, checkout, and admin actions.

### RBAC

| Role | Access |
|------|--------|
| `user` | Profile page, cart, storefront, view store credit |
| `admin` | Everything above + full `/admin` panel |

Sessions are stored in SQLite, expire after 30 days, and are validated on every request via `src/middleware.ts`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Astro dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run db:migrate` | Apply SQL migrations |
| `npm run db:seed` | Insert sample data |
| `npm run db:setup` | Migrate + seed |
| `npm run db:studio` | Drizzle Studio (DB browser) |

## Audit logging

User-facing actions are recorded in the `system_logs` table via `logSystemEvent()` in `src/lib/audit/`. Categories: **auth**, **profile**, **transaction**, **admin**. Passwords are never logged. Admins browse and filter events at `/admin/logs`.

## Invoices (PDF)

After a successful simulated checkout, orders are stored in the database with a unique invoice number (`BM-YYYYMMDD-######`). Users can download a PDF invoice from:

- The cart success message (`/cart?orderId=…`)
- **Profile → Recent orders** (`/profile`)

Endpoint: `GET /api/invoices/[orderId]` (requires sign-in; users can only access their own orders).

## Catalog & reviews

- **`/catalog`** — search by name/description, filter by category, price range, and stock; sort by name or price.
- **`/catalog/[slug]`** — product details, average rating, and customer reviews.
- **Reviews** — signed-in users can submit one review per product (1–5 stars, optional title, optional image via URL or file upload to `public/uploads/reviews/`).

## Next steps

- [x] Authentication, RBAC, and profile management
- [x] Catalog and product detail pages (`/catalog`, `/catalog/[slug]`)
- [x] Cart and checkout simulation
- [x] Admin CRUD for products and users
- [x] Product search, filters, and reviews
