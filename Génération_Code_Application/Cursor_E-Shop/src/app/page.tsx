import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { StatsBar } from "@/components/landing/StatsBar";
import { WeatherWidget } from "@/components/landing/WeatherWidget";
import { FeaturedProducts } from "@/components/landing/FeaturedProducts";
import { CategoryGrid } from "@/components/landing/CategoryGrid";
import { ValueProps } from "@/components/landing/ValueProps";
import { CTASection } from "@/components/landing/CTASection";
import {
  buildProductWhere,
  parseProductSearchParams,
  type ProductSearchParams,
} from "@/lib/product-filters";
import { prisma } from "@/lib/prisma";
import { getChicoutimiWeather } from "@/lib/weather";

interface HomePageProps {
  searchParams: Promise<ProductSearchParams>;
}

export default async function Home({ searchParams }: HomePageProps) {
  const rawParams = await searchParams;
  const filters = parseProductSearchParams(rawParams);

  let products: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: { toString(): string };
    imageUrl: string | null;
    category: string;
    reviews: { rating: number }[];
  }[] = [];
  let productCount = 0;

  const productSelect = {
    id: true,
    name: true,
    slug: true,
    description: true,
    price: true,
    imageUrl: true,
    category: true,
    reviews: { select: { rating: true } },
  } as const;

  try {
    const where = buildProductWhere(filters);

    [products, productCount] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        ...(filters.hasFilters ? {} : { take: 6 }),
        select: productSelect,
      }),
      prisma.product.count(),
    ]);
  } catch {
    // DB unavailable — landing still renders with static sections
  }

  const weather = await getChicoutimiWeather();

  return (
    <div className="flex min-h-full flex-col bg-zinc-950 text-zinc-100">
      <Header />

      <main className="flex-1">
        <HeroSection />
        <StatsBar productCount={productCount} />
        <WeatherWidget weather={weather} />
        <FeaturedProducts
          products={products}
          searchParams={rawParams}
          hasFilters={filters.hasFilters}
        />
        <CategoryGrid />
        <ValueProps />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}
