import "dotenv/config";
import { ProductCategory, Role } from "../generated/prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { prisma } from "../src/lib/prisma";

const products = [
  {
    name: "Summit 32oz Tumbler",
    slug: "summit-32oz-tumbler",
    description:
      "Double-wall vacuum insulated stainless steel. Keeps drinks cold 24h or hot 12h.",
    priceCents: 4499,
    category: ProductCategory.TUMBLER,
    featured: true,
  },
  {
    name: "Ridge 20oz Travel Mug",
    slug: "ridge-20oz-travel-mug",
    description: "Leak-proof lid, slim fit for cup holders, premium brushed steel finish.",
    priceCents: 3499,
    category: ProductCategory.TUMBLER,
    featured: true,
  },
  {
    name: "Artisan Etched Pint Glass Set",
    slug: "artisan-etched-pint-set",
    description: "Set of 4 custom-etched borosilicate glasses. Dishwasher safe.",
    priceCents: 5999,
    category: ProductCategory.GLASSWARE,
    featured: true,
  },
  {
    name: "Coastal Wine Tumbler",
    slug: "coastal-wine-tumbler",
    description:
      "Insulated wine mug with splash-resistant lid. Perfect for patio evenings.",
    priceCents: 2999,
    category: ProductCategory.WINE_MUG,
    featured: false,
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

  const adminPassword = await hashPassword("admin1234");
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash: adminPassword,
      role: Role.ADMIN,
      displayName: "Site Administrator",
      email: "admin@hydroflasked.local",
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
