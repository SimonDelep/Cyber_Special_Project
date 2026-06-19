import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const catalogProducts = [
  {
    name: "Organic Crew Tee",
    slug: "organic-crew-tee",
    description:
      "A relaxed-fit tee in 100% certified organic Egyptian cotton. Breathable, soft, and built for everyday wear.",
    priceCents: 4800,
    featured: true,
  },
  {
    name: "Recycled Fiber Hoodie",
    slug: "recycled-fiber-hoodie",
    description:
      "Soft brushed interior with a blend of organic cotton and recycled fibers. Your go-to layer for cool mornings.",
    priceCents: 9800,
    featured: true,
  },
  {
    name: "Egyptian Cotton Oxford Shirt",
    slug: "egyptian-cotton-oxford-shirt",
    description:
      "Crisp oxford weave from long-staple organic Egyptian cotton. Timeless collar, easy to dress up or down.",
    priceCents: 8900,
    featured: true,
  },
  {
    name: "Recycled Chino Trousers",
    slug: "recycled-chino-trousers",
    description:
      "Straight-leg chinos in organic cotton with recycled fiber reinforcement. Comfortable stretch and clean drape.",
    priceCents: 11200,
    featured: true,
  },
  {
    name: "Organic Rib Tank",
    slug: "organic-rib-tank",
    description:
      "Fine-rib tank in certified organic cotton. Layer under shirts or wear alone in warmer weather.",
    priceCents: 3600,
    featured: true,
  },
  {
    name: "French Terry Sweatshirt",
    slug: "french-terry-sweatshirt",
    description:
      "Midweight loopback sweatshirt blending organic Egyptian cotton with recycled yarn. Relaxed, unisex fit.",
    priceCents: 8400,
    featured: true,
  },
];

async function main() {
  const essentials = await prisma.category.upsert({
    where: { slug: "essentials" },
    update: {},
    create: {
      name: "Essentials",
      slug: "essentials",
    },
  });

  for (const product of catalogProducts) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        description: product.description,
        priceCents: product.priceCents,
        featured: product.featured,
        inStock: true,
        categoryId: essentials.id,
      },
      create: {
        ...product,
        imageUrl: null,
        inStock: true,
        categoryId: essentials.id,
      },
    });
  }

  console.log(`Seeded ${catalogProducts.length} products in ${essentials.name}`);

  const adminPassword = await hashPassword("Admin123!");
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      email: "admin@everthread.local",
      passwordHash: adminPassword,
      role: "ADMIN",
      displayName: "Site Administrator",
    },
  });

  console.log(`Seeded admin user: ${admin.username} (password: Admin123!)`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
