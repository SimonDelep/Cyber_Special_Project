# AeroPure

E-commerce site for premium travel tech: magnetic wireless charging stations, solar power banks, and travel organizers.

## Stack

- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS 4**
- **Prisma** + **PostgreSQL**

## Project structure

```
src/
├── app/              # Routes & layouts
├── components/
│   ├── layout/       # Header, Footer
│   └── landing/      # Landing page sections
├── lib/              # Prisma client, constants, utils
└── types/            # Shared TypeScript types
prisma/
├── schema.prisma     # Database schema
└── seed.ts           # Sample products
```

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL (Docker)

```bash
docker compose up -d
```

### 3. Configure environment

Copy `.env.example` to `.env` if needed (defaults match Docker setup).

### 4. Run migrations & seed

```bash
npm run db:migrate
npm run db:seed
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Authentication

- **Register** — `/register` (username, email, password)
- **Login / Logout** — `/login`, session cookie (7 days)
- **Profile** — `/profile` (edit email, name, bio, avatar via URL or file upload, delete account)
- **RBAC** — `USER` and `ADMIN` roles; admins use `/admin` to manage users, balances, and products

**Seeded admin account** (after `npm run db:seed`):

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin12345` |

### Product catalog (`/products`)

- Search by name, keyword, or slug
- Filter by category, price range, and stock
- Product detail pages with customer reviews (image via URL or file upload)

### Shopping cart & checkout (`/cart`)

- Add products from the homepage catalog (requires sign-in)
- Simulate checkout against your **account balance**
- Insufficient funds show an error; successful orders debit your balance
- After checkout, **download a PDF invoice** for the order (also available under Recent orders)

**Test:** sign in as `admin` / `admin12345` (seeded with $500 balance), add items, then use **Simulate checkout** on `/cart`.

### Admin panel (`/admin`)

- **Users** — edit email, name, role; set balance or apply +/- adjustments; delete users
- **Products** — create, update, delete, or **bulk import via CSV** (template at `/samples/products-import-template.csv`)
- **System logs** — audit trail of logins, profile changes, checkouts, cart actions, and admin operations

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Seed sample products |
| `npm run db:studio` | Open Prisma Studio |
