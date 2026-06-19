import { AboutSection } from "@/components/landing/AboutSection";
import { FeaturedProducts } from "@/components/landing/FeaturedProducts";
import { HeroSection } from "@/components/landing/HeroSection";
import { NewsletterSection } from "@/components/landing/NewsletterSection";
import { ValuesSection } from "@/components/landing/ValuesSection";
import { prisma } from "@/lib/prisma";

async function getShopProducts() {
  try {
    return await prisma.product.findMany({
      where: { featured: true, inStock: true },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        priceCents: true,
        imageUrl: true,
        inStock: true,
      },
    });
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const products = await getShopProducts();

  return (
    <>
      <HeroSection />
      <ValuesSection />
      <FeaturedProducts products={products} />
      <AboutSection />
      <NewsletterSection />
    </>
  );
}
