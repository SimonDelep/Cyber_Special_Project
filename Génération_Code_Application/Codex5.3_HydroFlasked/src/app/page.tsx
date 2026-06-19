import { Hero } from "@/components/landing/Hero";
import { Categories } from "@/components/landing/Categories";
import { FeaturedProducts } from "@/components/landing/FeaturedProducts";
import { CTA } from "@/components/landing/CTA";
import { HydrationWeatherSection } from "@/components/landing/HydrationWeatherSection";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  let featuredProducts: Awaited<ReturnType<typeof prisma.product.findMany>> = [];

  try {
    featuredProducts = await prisma.product.findMany({
      where: { featured: true },
      take: 3,
      orderBy: { createdAt: "asc" },
    });
  } catch {
    featuredProducts = [];
  }

  return (
    <>
      <Hero />
      <HydrationWeatherSection />
      <Categories />
      <FeaturedProducts products={featuredProducts} />
      <CTA />
    </>
  );
}
