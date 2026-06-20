# Lignum Design

E-commerce de mobilier artisanal en bois massif — Next.js, Tailwind CSS, Prisma et PostgreSQL.

## Stack

- **Framework** — [Next.js 15](https://nextjs.org/) (App Router)
- **Styling** — [Tailwind CSS 4](https://tailwindcss.com/)
- **ORM** — [Prisma](https://www.prisma.io/)
- **Base de données** — PostgreSQL

## Structure du projet

```
src/
├── app/              # Routes et layouts (App Router)
├── components/
│   ├── landing/      # Sections de la page d'accueil
│   ├── layout/       # Header, Footer, etc.
│   └── ui/           # Composants réutilisables (à venir)
├── config/           # Configuration du site
├── lib/              # Utilitaires (Prisma client, helpers)
└── types/            # Types TypeScript partagés
prisma/
└── schema.prisma     # Schéma de base de données
```

## Démarrage

### Prérequis

- Node.js 20+
- PostgreSQL en cours d'exécution

### Installation

```bash
npm install
cp .env.example .env
# Éditez DATABASE_URL dans .env avec vos identifiants PostgreSQL
npm run db:push
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

### Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Serveur de production |
| `npm run lint` | Vérification ESLint |
| `npm run db:generate` | Génère le client Prisma |
| `npm run db:push` | Synchronise le schéma avec la BDD |
| `npm run db:migrate` | Crée une migration |
| `npm run db:studio` | Interface Prisma Studio |

## Licence

Projet privé — UQAC Projet Spécial Cyber.
