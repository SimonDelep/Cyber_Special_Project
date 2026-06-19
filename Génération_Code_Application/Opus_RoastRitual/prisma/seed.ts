import "dotenv/config";
import { createPrismaClient } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/password";

const prisma = createPrismaClient();

async function main() {
  const adminPassword = await hashPassword("admin123");
  const demoPassword = await hashPassword("demo1234");

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash: adminPassword,
      name: "Site Administrator",
      role: "ADMIN",
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { username: "demo" },
    update: { balanceCents: 2500 },
    create: {
      username: "demo",
      passwordHash: demoPassword,
      name: "Demo User",
      role: "USER",
      bio: "Exploring specialty coffee and herbal tea rituals.",
      balanceCents: 2500,
    },
  });

  const ethiopian = await prisma.product.upsert({
    where: { slug: "yirgacheffe-whole-bean" },
    update: {
      imageUrl:
        "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80",
    },
    create: {
      slug: "yirgacheffe-whole-bean",
      name: "Yirgacheffe Whole Bean",
      description:
        "Bright citrus and floral notes from a single-origin Ethiopian highland farm.",
      category: "COFFEE",
      priceCents: 2499,
      origin: "Ethiopia",
      roastLevel: "Light",
      isEthical: true,
      imageUrl:
        "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80",
    },
  });

  await prisma.product.upsert({
    where: { slug: "colombian-huila-whole-bean" },
    update: {
      imageUrl:
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80",
    },
    create: {
      slug: "colombian-huila-whole-bean",
      name: "Colombian Huila Whole Bean",
      description:
        "Caramel sweetness and a silky body from smallholder farms in Colombia's Huila region.",
      category: "COFFEE",
      priceCents: 2299,
      origin: "Colombia",
      roastLevel: "Medium",
      isEthical: true,
      imageUrl:
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80",
    },
  });

  await prisma.product.upsert({
    where: { slug: "sumatra-mandheling-whole-bean" },
    update: {
      imageUrl:
        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80",
    },
    create: {
      slug: "sumatra-mandheling-whole-bean",
      name: "Sumatra Mandheling Whole Bean",
      description:
        "Earthy, full-bodied cup with dark chocolate undertones — ideal for French press.",
      category: "COFFEE",
      priceCents: 2199,
      origin: "Indonesia",
      roastLevel: "Dark",
      isEthical: true,
      imageUrl:
        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80",
    },
  });

  await prisma.product.upsert({
    where: { slug: "guatemala-antigua-whole-bean" },
    update: {
      imageUrl:
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80",
    },
    create: {
      slug: "guatemala-antigua-whole-bean",
      name: "Guatemala Antigua Whole Bean",
      description:
        "Balanced cocoa and spice notes from volcanic soils in the Antigua valley.",
      category: "COFFEE",
      priceCents: 2399,
      origin: "Guatemala",
      roastLevel: "Medium",
      isEthical: true,
      imageUrl:
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80",
    },
  });

  const chamomile = await prisma.product.upsert({
    where: { slug: "calm-chamomile-loose-leaf" },
    update: {
      imageUrl:
        "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&q=80",
    },
    create: {
      slug: "calm-chamomile-loose-leaf",
      name: "Calm Chamomile Loose Leaf",
      description:
        "Organic Egyptian chamomile petals for a soothing evening ritual.",
      category: "TEA",
      priceCents: 1899,
      origin: "Egypt",
      isEthical: true,
      imageUrl:
        "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&q=80",
    },
  });

  await prisma.product.upsert({
    where: { slug: "peppermint-sage-loose-leaf" },
    update: {
      imageUrl:
        "https://images.unsplash.com/photo-1564890369478-c89ca6d9ede9?w=800&q=80",
    },
    create: {
      slug: "peppermint-sage-loose-leaf",
      name: "Peppermint & Sage Loose Leaf",
      description:
        "A refreshing blend of Pacific Northwest peppermint and garden sage for clarity.",
      category: "TEA",
      priceCents: 1699,
      origin: "USA",
      isEthical: true,
      imageUrl:
        "https://images.unsplash.com/photo-1564890369478-c89ca6d9ede9?w=800&q=80",
    },
  });

  await prisma.product.upsert({
    where: { slug: "lavender-rose-herbal-blend" },
    update: {
      imageUrl:
        "https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=800&q=80",
    },
    create: {
      slug: "lavender-rose-herbal-blend",
      name: "Lavender Rose Herbal Blend",
      description:
        "Delicate rose petals and Provence lavender for a calming, floral cup before bed.",
      category: "TEA",
      priceCents: 1999,
      origin: "France",
      isEthical: true,
      imageUrl:
        "https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=800&q=80",
    },
  });

  await prisma.subscriptionBox.upsert({
    where: { slug: "morning-ritual-box" },
    update: {},
    create: {
      slug: "morning-ritual-box",
      name: "Morning Ritual Box",
      tagline: "Coffee lovers, monthly",
      description:
        "Two rotating ethically sourced whole-bean coffees, cupping notes included.",
      priceCents: 4499,
      interval: "MONTHLY",
      items: {
        create: [{ productId: ethiopian.id, quantity: 2 }],
      },
    },
  });

  await prisma.review.upsert({
    where: {
      productId_userId: {
        productId: ethiopian.id,
        userId: demoUser.id,
      },
    },
    update: {},
    create: {
      productId: ethiopian.id,
      userId: demoUser.id,
      rating: 5,
      title: "Bright and floral",
      body: "One of my favorite light roasts. The citrus notes really shine with a pour-over.",
      imageUrl:
        "https://images.unsplash.com/photo-1511920170033-f8396924c10b?w=800&q=80",
    },
  });

  await prisma.review.upsert({
    where: {
      productId_userId: {
        productId: chamomile.id,
        userId: demoUser.id,
      },
    },
    update: {},
    create: {
      productId: chamomile.id,
      userId: demoUser.id,
      rating: 4,
      title: "Perfect before bed",
      body: "Soothing and mild. I steep for five minutes and it never gets bitter.",
    },
  });

  await prisma.subscriptionBox.upsert({
    where: { slug: "evening-unwind-box" },
    update: {},
    create: {
      slug: "evening-unwind-box",
      name: "Evening Unwind Box",
      tagline: "Herbal tea, monthly",
      description:
        "A curated selection of loose-leaf herbal blends for calm evenings.",
      priceCents: 3499,
      interval: "MONTHLY",
      items: {
        create: [{ productId: chamomile.id, quantity: 2 }],
      },
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
