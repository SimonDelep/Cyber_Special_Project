# AuraAsh

E-commerce website for handcrafted home fragrance — hand-poured soy wax candles with wooden wicks, concrete incense holders, and essential oil diffusers.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS 4**
- **Prisma 7** + **PostgreSQL**

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the local database

```bash
docker compose up -d
```

### 3. Run migrations & seed

```bash
npm run db:migrate
npm run db:seed
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/                  # Next.js App Router pages & layouts
├── components/
│   ├── home/             # Landing page sections
│   ├── layout/           # Header, Footer
│   └── ui/               # Reusable UI primitives
├── lib/                  # Shared utilities (prisma, helpers)
└── types/                # TypeScript type definitions
prisma/
├── schema.prisma         # Database schema
├── migrations/           # Migration history
└── seed.ts               # Sample product data
src/generated/
└── prisma/               # Generated Prisma client
```

## Scripts

| Command            | Description                    |
| ------------------ | ------------------------------ |
| `npm run dev`      | Start development server       |
| `npm run build`    | Production build               |
| `npm run db:migrate` | Apply database migrations    |
| `npm run db:seed`  | Seed sample products           |
| `npm run db:studio`| Open Prisma Studio             |

## Environment

Copy `.env.example` to `.env` and adjust if needed:

```
DATABASE_URL="postgresql://auraash:auraash@localhost:15432/auraash?schema=public"
```
