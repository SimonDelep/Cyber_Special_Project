import { PrismaClient, ProductCategory, Role } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const products = [
  {
    slug: "radiance-botanical-serum",
    name: "Radiance Botanical Serum",
    description:
      "Plant-based, cruelty-free facial serum with vitamin-rich botanicals for a luminous, even-toned complexion.",
    category: ProductCategory.SERUM,
    priceCents: 6800,
    imageUrl:
      "https://images.unsplash.com/photo-1620916560428-34caa503e42c?w=800&q=80",
    featured: true,
    inStock: true,
  },
  {
    slug: "calm-roots-balancing-serum",
    name: "Calm Roots Balancing Serum",
    description:
      "Soothing serum with centella and licorice root to calm redness and restore balance for sensitive skin.",
    category: ProductCategory.SERUM,
    priceCents: 7200,
    imageUrl:
      "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80",
    featured: true,
    inStock: true,
  },
  {
    slug: "cell-renewal-night-cream",
    name: "Cell Renewal Night Cream",
    description:
      "Exosome-infused night cream that supports overnight repair while you sleep—vegan and dermatologist-friendly.",
    category: ProductCategory.NIGHT_CREAM,
    priceCents: 8900,
    imageUrl:
      "https://images.unsplash.com/photo-1612817288484-6f9169f2b907?w=800&q=80",
    featured: true,
    inStock: true,
  },
  {
    slug: "velvet-leaf-barrier-cream",
    name: "Velvet Leaf Barrier Cream",
    description:
      "Rich plant ceramide cream that locks in moisture and strengthens your skin barrier through the night.",
    category: ProductCategory.NIGHT_CREAM,
    priceCents: 8400,
    imageUrl:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80",
    featured: true,
    inStock: true,
  },
  {
    slug: "dew-drop-eye-patches",
    name: "Dew Drop Eye Patches",
    description:
      "Cooling botanical under-eye patches with cucumber and chamomile to depuff and brighten tired eyes.",
    category: ProductCategory.EYE_PATCH,
    priceCents: 3200,
    imageUrl:
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d880?w=800&q=80",
    featured: true,
    inStock: true,
  },
  {
    slug: "golden-hour-brightening-patches",
    name: "Golden Hour Brightening Patches",
    description:
      "Vitamin C and green tea hydrogel patches that illuminate the under-eye area in just fifteen minutes.",
    category: ProductCategory.EYE_PATCH,
    priceCents: 3600,
    imageUrl:
      "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800&q=80",
    featured: true,
    inStock: true,
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

  const adminPasswordHash = await hash("admin123", 12);
  await prisma.user.upsert({
    where: { username: "admin" },
    update: { balanceCents: 50000 },
    create: {
      username: "admin",
      name: "FloraFoam Admin",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      balanceCents: 50000,
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
