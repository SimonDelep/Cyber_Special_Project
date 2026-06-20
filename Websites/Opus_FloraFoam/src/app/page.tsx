import { ChicoutimiWeather } from "@/components/landing/ChicoutimiWeather";
import { FeaturedProducts } from "@/components/landing/FeaturedProducts";
import { Hero } from "@/components/landing/Hero";
import { Values } from "@/components/landing/Values";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  let products: Awaited<ReturnType<typeof prisma.product.findMany>> = [];

  try {
    products = await prisma.product.findMany({
      where: { inStock: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
  } catch {
    // Database may be unavailable during first setup
  }

  return (
    <>
      <ChicoutimiWeather />
      <Hero />
      <Values />
      <FeaturedProducts products={products} />
    </>
  );
}
