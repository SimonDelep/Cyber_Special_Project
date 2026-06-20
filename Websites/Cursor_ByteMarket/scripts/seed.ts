import { getDb, closeDb } from "../src/db/client";
import { categories, products, users } from "../src/db/schema";
import { hashPassword } from "../src/lib/auth/password";

const db = getDb();

const categoryRows = [
  {
    slug: "components",
    name: "Components",
    description: "CPUs, GPUs, RAM, and motherboards",
    imageUrl: null,
  },
  {
    slug: "peripherals",
    name: "Peripherals",
    description: "Keyboards, mice, monitors, and headsets",
    imageUrl: null,
  },
  {
    slug: "storage",
    name: "Storage",
    description: "SSDs, HDDs, and external drives",
    imageUrl: null,
  },
  {
    slug: "networking",
    name: "Networking",
    description: "Routers, switches, and adapters",
    imageUrl: null,
  },
] as const;

db.insert(categories).values([...categoryRows]).onConflictDoNothing().run();

const cats = db.select().from(categories).all();
const bySlug = Object.fromEntries(cats.map((c) => [c.slug, c.id]));

const productRows = [
  {
    slug: "ryzen-7-7800x3d",
    name: "AMD Ryzen 7 7800X3D",
    description: "8-core gaming processor with 3D V-Cache for peak frame rates.",
    priceCents: 44999,
    stock: 24,
    categoryId: bySlug.components,
    imageUrl:
      "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&q=80&auto=format&fit=crop",
    featured: true,
  },
  {
    slug: "rtx-4070-super",
    name: "NVIDIA RTX 4070 Super",
    description: "1440p graphics card with DLSS 3 and ray tracing.",
    priceCents: 64999,
    stock: 12,
    categoryId: bySlug.components,
    imageUrl:
      "https://images.unsplash.com/photo-1597858713181-d9866d6980f1?w=800&q=80&auto=format&fit=crop",
    featured: true,
  },
  {
    slug: "keychron-k2",
    name: "Keychron K2 Wireless",
    description: "Compact mechanical keyboard, hot-swappable switches.",
    priceCents: 11999,
    stock: 40,
    categoryId: bySlug.peripherals,
    imageUrl:
      "https://images.unsplash.com/photo-1511467687858-23d96f86a2e4?w=800&q=80&auto=format&fit=crop",
    featured: true,
  },
  {
    slug: "samsung-990-pro-2tb",
    name: "Samsung 990 PRO 2TB",
    description: "PCIe 4.0 NVMe SSD, up to 7,450 MB/s sequential read.",
    priceCents: 19999,
    stock: 35,
    categoryId: bySlug.storage,
    imageUrl:
      "https://images.unsplash.com/photo-1597872200969-2a65a3b0c3f5?w=800&q=80&auto=format&fit=crop",
    featured: true,
  },
  {
    slug: "ubiquiti-u6-plus",
    name: "Ubiquiti UniFi U6+",
    description: "Wi-Fi 6 access point for home and small office networks.",
    priceCents: 12999,
    stock: 18,
    categoryId: bySlug.networking,
    imageUrl:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80&auto=format&fit=crop",
    featured: true,
  },
  {
    slug: "logitech-mx-master-3s",
    name: "Logitech MX Master 3S",
    description: "Ergonomic wireless mouse with MagSpeed scroll wheel.",
    priceCents: 13999,
    stock: 28,
    categoryId: bySlug.peripherals,
    imageUrl:
      "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80&auto=format&fit=crop",
    featured: true,
  },
];

db.delete(products).run();
db.insert(products).values(productRows).run();

const now = new Date();
db
  .insert(users)
  .values({
    username: "admin",
    passwordHash: hashPassword("admin12345"),
    role: "admin",
    displayName: "Administrator",
    email: null,
    createdAt: now,
    updatedAt: now,
  })
  .onConflictDoNothing()
  .run();

closeDb();
console.log("Seed data inserted (includes admin user: admin / admin12345).");
