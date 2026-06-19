import { PrismaClient, ProductCategory, Role } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

const products = [
  {
    slug: "magdock-pro-3",
    name: "MagDock Pro 3",
    description:
      "A 3-in-1 magnetic wireless charging station for iPhone, Apple Watch, and AirPods. Clean desk setup with fast Qi2 charging.",
    price: 129.99,
    category: ProductCategory.WIRELESS_CHARGING,
    featured: true,
    imageUrl: null,
  },
  {
    slug: "solarvault-20000",
    name: "SolarVault 20000",
    description:
      "High-capacity 20,000 mAh solar power bank with USB-C PD 65W. Built for travel and off-grid reliability.",
    price: 89.99,
    category: ProductCategory.SOLAR_POWER_BANK,
    featured: true,
    imageUrl: null,
  },
  {
    slug: "aerocarry-elite",
    name: "AeroCarry Elite",
    description:
      "Sleek travel tech organizer with cable routing, padded compartments, and TSA-friendly layout.",
    price: 59.99,
    category: ProductCategory.TRAVEL_ORGANIZER,
    featured: true,
    imageUrl: null,
  },
  {
    slug: "magpad-slim",
    name: "MagPad Slim",
    description:
      "Ultra-thin dual magnetic charging pad for phone and earbuds. Perfect for nightstands and small desks.",
    price: 49.99,
    category: ProductCategory.WIRELESS_CHARGING,
    featured: true,
    imageUrl: null,
  },
  {
    slug: "solarvault-10000",
    name: "SolarVault 10000",
    description:
      "Compact 10,000 mAh solar charger with built-in cable storage and 30W USB-C output for everyday carry.",
    price: 64.99,
    category: ProductCategory.SOLAR_POWER_BANK,
    featured: true,
    imageUrl: null,
  },
  {
    slug: "cablenest-roll",
    name: "CableNest Roll",
    description:
      "Roll-up travel pouch with labeled elastic loops and a zippered pocket for adapters, SD cards, and chargers.",
    price: 34.99,
    category: ProductCategory.TRAVEL_ORGANIZER,
    featured: true,
    imageUrl: null,
  },
];

async function main() {
  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    });
  }

  const adminPassword = await hashPassword("admin12345");
  await prisma.user.upsert({
    where: { username: "admin" },
    update: { balance: 500 },
    create: {
      username: "admin",
      email: "admin@aeropure.local",
      passwordHash: adminPassword,
      role: Role.ADMIN,
      firstName: "Site",
      lastName: "Administrator",
      balance: 500,
    },
  });
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
