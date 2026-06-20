import { getDb } from "./client";
import { products } from "./schema";

const seedProducts = [
  {
    slug: "stack-pro-3-tier",
    name: "Stack Pro 3-Tier Glass Set",
    description:
      "Three borosilicate glass containers with airtight lids. Stack vertically in your bag or fridge without shifting.",
    category: "meal-prep",
    priceCents: 8999,
    imageUrl: "/images/stack-pro-3-tier.svg",
    featured: true,
    stackable: true,
    leakProof: true,
    capacityMl: 2100,
  },
  {
    slug: "executive-bento-leakproof",
    name: "Executive Leak-Proof Bento",
    description:
      "Dual-compartment bento with silicone seal and microwave-safe glass base. Built for commute and boardroom lunches.",
    category: "bento",
    priceCents: 5499,
    imageUrl: "/images/executive-bento.svg",
    featured: true,
    stackable: false,
    leakProof: true,
    capacityMl: 980,
  },
  {
    slug: "solo-prep-650",
    name: "Solo Prep 650ml",
    description:
      "Single-serving glass container for focused meal plans. Pairs with the Stack Pro lid system.",
    category: "meal-prep",
    priceCents: 2999,
    imageUrl: "/images/solo-prep.svg",
    featured: true,
    stackable: true,
    leakProof: true,
    capacityMl: 650,
  },
  {
    slug: "week-grid-5-pack",
    name: "Week Grid 5-Pack",
    description:
      "Five uniform containers for Sunday prep. Label-friendly lids and uniform footprint for fridge organization.",
    category: "meal-prep",
    priceCents: 12499,
    imageUrl: "/images/week-grid.svg",
    featured: true,
    stackable: true,
    leakProof: true,
    capacityMl: 3250,
  },
  {
    slug: "compact-bento-duo",
    name: "Compact Bento Duo",
    description:
      "Two side-by-side glass compartments with shared leak-proof frame. Ideal for protein plus greens without mixing until lunch.",
    category: "bento",
    priceCents: 4499,
    imageUrl: "/images/compact-bento-duo.svg",
    featured: true,
    stackable: false,
    leakProof: true,
    capacityMl: 1100,
  },
  {
    slug: "pro-salad-crisper",
    name: "Pro Salad Crisper 1.2L",
    description:
      "Tall glass crisper with vented lid insert keeps greens fresh through Thursday. Fits standard fridge doors and prep bags.",
    category: "meal-prep",
    priceCents: 3999,
    imageUrl: "/images/pro-salad-crisper.svg",
    featured: true,
    stackable: true,
    leakProof: true,
    capacityMl: 1200,
  },
];

function seed() {
  const db = getDb();

  console.log("Seeding PrepPro Aesthetic database…");

  for (const product of seedProducts) {
    db.insert(products)
      .values(product)
      .onConflictDoNothing({ target: products.slug })
      .run();
  }

  console.log(`Seeded ${seedProducts.length} products.`);
}

try {
  seed();
} catch (err) {
  console.error(err);
  process.exit(1);
}
