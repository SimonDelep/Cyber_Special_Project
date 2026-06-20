import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(input) {
  return String(input)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function upsertCategory({ name, slug, description, imageUrl }) {
  return prisma.category.upsert({
    where: { slug },
    update: {
      name,
      description: description ?? null,
      imageUrl: imageUrl ?? null,
    },
    create: {
      name,
      slug,
      description: description ?? null,
      imageUrl: imageUrl ?? null,
    },
    select: { id: true, name: true, slug: true },
  });
}

async function upsertProduct(p) {
  return prisma.product.upsert({
    where: { slug: p.slug },
    update: {
      name: p.name,
      description: p.description,
      price: String(p.price),
      compareAt: p.compareAt == null ? null : String(p.compareAt),
      stock: p.stock,
      featured: p.featured ?? false,
      status: p.status ?? "PUBLISHED",
      images: p.images ?? [],
      material: p.material ?? null,
      dimensions: p.dimensions ?? null,
      weight: p.weight ?? null,
      categoryId: p.categoryId,
    },
    create: {
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: String(p.price),
      compareAt: p.compareAt == null ? null : String(p.compareAt),
      stock: p.stock,
      featured: p.featured ?? false,
      status: p.status ?? "PUBLISHED",
      images: p.images ?? [],
      material: p.material ?? null,
      dimensions: p.dimensions ?? null,
      weight: p.weight ?? null,
      categoryId: p.categoryId,
    },
    select: { id: true, name: true, slug: true, status: true },
  });
}

async function main() {
  const categories = await Promise.all([
    upsertCategory({
      name: "Salle à manger",
      slug: "salle-a-manger",
      description: "Tables, chaises et buffets en bois massif.",
      imageUrl:
        "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80",
    }),
    upsertCategory({
      name: "Salon",
      slug: "salon",
      description: "Tables basses, étagères et consoles au style chaleureux.",
      imageUrl:
        "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80",
    }),
    upsertCategory({
      name: "Chambre",
      slug: "chambre",
      description: "Chevets, commodes et bancs conçus pour durer.",
      imageUrl:
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80",
    }),
  ]);

  const bySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));

  const products = [
    {
      name: "Table en chêne « Héritage »",
      slug: "table-chene-heritage",
      description:
        "Table à manger en chêne massif avec finition huile-cire. Un plateau généreux et des lignes intemporelles.",
      price: 1299.0,
      compareAt: 1499.0,
      stock: 6,
      featured: true,
      images: [
        "https://images.unsplash.com/photo-1549497538-303791108f95?auto=format&fit=crop&w=1200&q=80",
      ],
      material: "Chêne massif",
      dimensions: "180 × 90 × 75 cm",
      weight: "55 kg",
      categoryId: bySlug["salle-a-manger"].id,
    },
    {
      name: "Chaise en noyer « Rivière »",
      slug: "chaise-noyer-riviere",
      description:
        "Chaise en noyer massif au dossier légèrement cintré. Confort durable, assemblage traditionnel.",
      price: 349.0,
      stock: 18,
      featured: true,
      images: [
        "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
      ],
      material: "Noyer massif",
      dimensions: "46 × 52 × 82 cm",
      weight: "7 kg",
      categoryId: bySlug["salle-a-manger"].id,
    },
    {
      name: "Console en érable « Atelier »",
      slug: "console-erable-atelier",
      description:
        "Console fine en érable avec tiroir discret. Parfaite pour une entrée lumineuse et minimaliste.",
      price: 699.0,
      stock: 8,
      images: [
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80",
      ],
      material: "Érable massif",
      dimensions: "120 × 35 × 78 cm",
      weight: "18 kg",
      categoryId: bySlug["salon"].id,
    },
    {
      name: "Bibliothèque « Lignée »",
      slug: "bibliotheque-lignee",
      description:
        "Bibliothèque modulable en bois massif, pensée pour évoluer avec votre espace. Tablettes réglables.",
      price: 1590.0,
      stock: 3,
      images: [
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80",
      ],
      material: "Chêne massif",
      dimensions: "200 × 35 × 210 cm",
      weight: "75 kg",
      categoryId: bySlug["salon"].id,
    },
    {
      name: "Table de chevet « Nuit claire »",
      slug: "table-chevet-nuit-claire",
      description:
        "Chevet compact avec un tiroir à coulisse bois. Design discret, idéal pour une chambre épurée.",
      price: 289.0,
      stock: 14,
      images: [
        "https://images.unsplash.com/photo-1616594039964-4082a936a365?auto=format&fit=crop&w=1200&q=80",
      ],
      material: "Érable massif",
      dimensions: "45 × 35 × 55 cm",
      weight: "9 kg",
      categoryId: bySlug["chambre"].id,
    },
  ];

  const created = [];
  for (const p of products) {
    const slug = p.slug || slugify(p.name);
    created.push(await upsertProduct({ ...p, slug }));
  }

  console.log("Seed complete.");
  console.log("Categories:", categories.map((c) => c.slug).join(", "));
  console.log("Products:", created.map((p) => `${p.slug} (${p.status})`).join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

