# E-Shop

Modern electronics e-commerce storefront built with Next.js, Tailwind CSS, Prisma, and PostgreSQL. Includes customer accounts, RBAC, and an admin panel.

## Stack

- **Next.js** (App Router, TypeScript, `src/` directory)
- **Tailwind CSS** v4
- **Prisma ORM** with PostgreSQL
- **Auth.js / NextAuth v5** (JWT sessions, credentials provider, bcrypt)
- **Zod** for form validation
- **React** 19

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [PostgreSQL](https://www.postgresql.org/) running locally (or a hosted instance)
- **Or** [Docker Desktop](https://www.docker.com/products/docker-desktop/) to start PostgreSQL with one command

## Setup

0. **Start PostgreSQL** (required for register, login, admin)

   **Option A — Docker (recommended for local dev):**

   ```bash
   npm run db:up
   ```

   Uses `docker-compose.yml` (user/password/db: `eshop` / `eshop` / `eshop` on port `5432`).

   **Option B — Existing PostgreSQL install:** ensure the service is running and set `DATABASE_URL` in `.env` to match your credentials.

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Edit `.env`:

   | Variable | Description |
   |----------|-------------|
   | `DATABASE_URL` | PostgreSQL connection string |
   | `AUTH_SECRET` | Random secret for signing JWTs (`openssl rand -base64 32`) |
   | `AUTH_URL` | App URL, e.g. `http://localhost:3000` |

   `NEXTAUTH_SECRET` and `NEXTAUTH_URL` are supported as legacy aliases.

3. **Generate Prisma client and apply schema**

   ```bash
   npm run db:generate
   npm run db:push
   ```

4. **Seed dev users and sample products**

   ```bash
   npm run db:seed
   ```

   **Dev-only credentials** (change in production):

   | Role | Email | Password |
   |------|-------|----------|
   | Admin | `admin@eshop.dev` | `Admin123!` |
   | Customer | `customer@eshop.dev` | `Customer123!` |

## Authentication approach

This project uses **Auth.js (NextAuth v5)** with:

- **Credentials provider** — email/password checked against bcrypt hashes in PostgreSQL
- **JWT session strategy** — no `Session` table; stateless cookies signed with `AUTH_SECRET`
- **Middleware** — protects `/account` and `/admin`
- **Server actions** — registration, login, profile updates (CSRF handled by Auth.js)

Configuration lives in `src/auth.ts`. API route: `/api/auth/[...nextauth]`.

### Create the first admin without seed

1. Register a customer at `/register`, or insert a user via Prisma Studio.
2. Promote to admin:

   ```sql
   UPDATE "User" SET role = 'ADMIN' WHERE email = 'your@email.com';
   ```

   Or run `npm run db:seed` for the default admin account.

## Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page |
| `/shop` | Public | Product catalog |
| `/shop/[slug]` | Public | Product detail + reviews (write review when logged in) |
| `/cart` | Authenticated | Shopping cart |
| `/checkout` | Authenticated | Place order (store credit) |
| `/register` | Guest | Create customer account |
| `/login` | Guest | Sign in |
| `/account` | Authenticated | Profile, balance, delete account |
| `/account/orders` | Authenticated | Order history |
| `/admin` | Admin | Redirects to users |
| `/admin/users` | Admin | List users |
| `/admin/users/[id]` | Admin | Edit user (role, balance) |
| `/admin/products` | Admin | List products |
| `/admin/products/new` | Admin | Create product |
| `/admin/products/[id]` | Admin | Edit product |

## RBAC

| Role | Permissions |
|------|-------------|
| `CUSTOMER` | Public pages, `/account`, `/cart`, `/checkout` |
| `ADMIN` | All customer permissions + `/admin/*` |

- Balance is stored as **integer cents** (`balanceCents`). Checkout deducts from balance.
- Cart is per-user in the database; sign in to add items and place orders.
- The last admin cannot be demoted or deleted.
- `passwordHash` is never returned to the client.

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Quick test flow

1. `npm run db:seed`
2. Visit `/login` → admin credentials → `/admin`
3. Sign out → register a new customer → `/account`
4. As admin, edit user balance at `/admin/users/[id]`

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Create and apply migrations |
| `npm run db:seed` | Seed admin, demo customer, sample products |
| `npm run db:up` | Start PostgreSQL via Docker Compose |
| `npm run db:down` | Stop PostgreSQL container |
| `npm run db:studio` | Open Prisma Studio |

## Project structure

```
src/
  auth.ts              # Auth.js config (credentials + JWT)
  middleware.ts        # Route guards
  actions/             # Server actions (auth, account, admin)
  app/
    login/ register/ account/
    admin/             # Admin layout + CRUD pages
    api/auth/[...nextauth]/
  components/
    forms/ layout/ ui/ admin/
  lib/
    auth.ts prisma.ts validations/ money.ts
prisma/
  schema.prisma        # User, Product, Role enum
  seed.ts
```

## Initialization note

The app was scaffolded with `create-next-app` using the name `e-shop`, then files were moved to the workspace root because the folder name `Test_module_mieux` is not a valid npm package name.
