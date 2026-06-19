import { PrismaClient, Prisma } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@eshop.dev";
  const adminPassword = "Admin123!";

  const passwordHash = await hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "E-Shop Admin",
      passwordHash,
      role: "ADMIN",
      balanceCents: 50000,
    },
  });

  const customerEmail = "customer@eshop.dev";
  const customerPassword = "Customer123!";

  await prisma.user.upsert({
    where: { email: customerEmail },
    update: {},
    create: {
      email: customerEmail,
      name: "Demo Customer",
      passwordHash: await hash(customerPassword, 12),
      role: "CUSTOMER",
      balanceCents: 500_000,
    },
  });

  const products = [
    {
      name: "NovaPhone X",
      slug: "novaphone-x",
      description: "Flagship smartphone with OLED display and 48h battery.",
      price: new Prisma.Decimal(999.99),
      imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
      category: "phones",
      stock: 42,
    },
    {
      name: "AeroBook Pro 14",
      slug: "aerobook-pro-14",
      description: "Ultralight laptop for creators and developers.",
      price: new Prisma.Decimal(1499.0),
      imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400",
      category: "laptops",
      stock: 18,
    },
    {
      name: "PulseBuds ANC",
      slug: "pulsebuds-anc",
      description: "Wireless earbuds with active noise cancellation.",
      price: new Prisma.Decimal(199.99),
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
      category: "audio",
      stock: 120,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    });
  }

  console.log("Seed complete.");
  console.log("Admin:", adminEmail, "/", adminPassword);
  console.log("Customer:", customerEmail, "/", customerPassword);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
