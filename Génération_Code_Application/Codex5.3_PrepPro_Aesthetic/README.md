# PrepPro Aesthetic

E-commerce site for stackable glass meal prep containers and leak-proof bento boxes, built for professionals.

## Stack

- **Astro** — site framework & API routes
- **Tailwind CSS v4** — styling (`@tailwindcss/vite`)
- **SolidJS** — interactive UI components
- **Nanostores** — client state (cart)
- **SQLite** — local database via `better-sqlite3` + **Drizzle ORM**
- **bcryptjs** — password hashing · cookie sessions · RBAC (`user` / `admin`)

## Project structure

```
├── data/                 # SQLite database (gitignored)
├── drizzle/              # Generated migrations
├── public/               # Static assets
├── src/
│   ├── components/       # Solid & Astro components
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── layout/
│   │   └── landing/
│   ├── db/               # Schema, client, queries, seed
│   ├── layouts/          # Astro layouts
│   ├── lib/auth/         # Sessions, RBAC, validation, avatars
│   ├── middleware.ts     # Session resolution & route guards
│   ├── pages/            # Routes & API
│   ├── stores/           # Nanostores
│   └── styles/           # Global CSS
├── astro.config.mjs
├── drizzle.config.ts
└── package.json
```

## Getting started

```bash
npm install
npm run db:setup    # schema + products + default users
npm run dev         # http://localhost:4321
```

### Default accounts (after `db:setup`)

| Role  | Username | Password   |
|-------|----------|------------|
| Admin | `admin`  | `Admin123!` |
| User  | `demo`   | `Demo1234!` |

## Authentication & profiles

| Page | Description |
|------|-------------|
| `/register` | Create account (username, email, password) |
| `/login` | Sign in with username or email |
| `/profile` | View/edit profile, avatar URL or file upload, change password, delete account |
| `/cart` | Shopping cart & simulated checkout |
| `/admin` | Admin panel: users, balances, products (RBAC) |

Sessions use an HTTP-only cookie (`preppro_session`, 30 days). Profile pictures can be set via **URL** or **file upload** (max 2 MB, stored in `public/uploads/avatars/`).

### API

| Method | Endpoint | Access |
|--------|----------|--------|
| `POST` | `/api/auth/register` | Public |
| `POST` | `/api/auth/login` | Public |
| `POST` | `/api/auth/logout` | Session |
| `GET` | `/api/auth/me` | Session optional |
| `GET` / `PUT` / `DELETE` | `/api/profile` | Authenticated |
| `POST` | `/api/profile/avatar` | Authenticated (multipart) |
| `GET` | `/api/admin/users` | Admin — list users with balances |
| `GET` / `PUT` / `DELETE` | `/api/admin/users/:id` | Admin — edit role, profile, balance |
| `GET` / `POST` | `/api/admin/products` | Admin — list / create products |
| `GET` / `PUT` / `DELETE` | `/api/admin/products/:id` | Admin — update / delete products |
| `GET` | `/api/products` | Public |
| `POST` | `/api/checkout` | Authenticated — debit account balance |

## Cart & checkout

- Add items from the home page; cart persists in **localStorage**.
- Open **/cart** to review quantities, see your **account balance**, and run **simulated checkout**.
- Checkout validates totals server-side against live product prices. If balance is insufficient, an error explains the shortfall; otherwise the order total is deducted from `balance_cents`.
- Demo user (`demo` / `Demo1234!`) starts with **$50.00** — use the admin panel to top up balances for testing.

## Admin panel (`/admin`)

Sign in as **admin** / **Admin123!**, then open `/admin`.

- **Users & balances** — select a user, edit display name, email, role, bio; set balance (CAD) or apply an adjustment (+/−); delete user (safeguards for last admin and self-delete).
- **Products** — create and edit catalog items (name, slug, description, category, price, image, featured/stackable/leak-proof flags).

Run `npm run db:migrate-balance` if upgrading an existing database without `balance_cents`.

### Database commands

| Command | Description |
|---------|-------------|
| `npm run db:push` | Push schema to SQLite |
| `npm run db:seed` | Seed sample products |
| `npm run db:seed-users` | Seed admin & demo users |
| `npm run db:migrate-balance` | Add `balance_cents` to existing DBs |
| `npm run db:setup` | Push + migrate + products + users |
| `npm run db:generate` | Generate migration files |

Copy `.env.example` to `.env` to customize `DATABASE_URL` (default: `./data/preppro.db`).

## Build

```bash
npm run build
npm run preview
```
