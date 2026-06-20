import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, ProductCategory, Role } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const products = [
    {
      name: "Ember & Sage Candle",
      slug: "ember-sage-candle",
      description:
        "A grounding blend of white sage and warm amber in a hand-poured soy wax vessel with a crackling wooden wick.",
      price: 38.0,
      category: ProductCategory.CANDLES,
      featured: true,
      inStock: true,
    },
    {
      name: "Midnight Cedar Candle",
      slug: "midnight-cedar-candle",
      description:
        "Deep cedarwood and soft vanilla notes for evening rituals. 45-hour burn time.",
      price: 42.0,
      category: ProductCategory.CANDLES,
      featured: true,
      inStock: true,
    },
    {
      name: "Golden Hour Candle",
      slug: "golden-hour-candle",
      description:
        "Bright bergamot and honeyed neroli in a matte ceramic vessel. Wooden wick, 50-hour burn.",
      price: 36.0,
      category: ProductCategory.CANDLES,
      featured: true,
      inStock: true,
    },
    {
      name: "Arc Concrete Incense Holder",
      slug: "arc-concrete-incense-holder",
      description:
        "Sculptural concrete holder with a matte finish. Fits standard incense sticks.",
      price: 28.0,
      category: ProductCategory.INCENSE_HOLDERS,
      featured: true,
      inStock: true,
    },
    {
      name: "Stone Bowl Incense Holder",
      slug: "stone-bowl-incense-holder",
      description:
        "Minimal bowl design in raw concrete. Catches ash cleanly for easy maintenance.",
      price: 32.0,
      category: ProductCategory.INCENSE_HOLDERS,
      featured: false,
      inStock: true,
    },
    {
      name: "Aura Mist Diffuser",
      slug: "aura-mist-diffuser",
      description:
        "Ultrasonic essential oil diffuser with soft ambient lighting and a 300 ml capacity.",
      price: 58.0,
      category: ProductCategory.DIFFUSERS,
      featured: true,
      inStock: true,
    },
    {
      name: "Calm Blend Essential Oils",
      slug: "calm-blend-essential-oils",
      description:
        "A pure essential oil set of lavender, bergamot, and frankincense for your diffuser.",
      price: 24.0,
      category: ProductCategory.DIFFUSERS,
      featured: false,
      inStock: true,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    });
  }

  console.log(`Seeded ${products.length} products.`);

  const adminPassword = await hashPassword("admin123");

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      email: "admin@auraash.com",
      passwordHash: adminPassword,
      role: Role.ADMIN,
      firstName: "Admin",
      lastName: "User",
    },
  });

  console.log("Seeded admin user (username: admin, password: admin123).");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
