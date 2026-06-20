import { AboutSection } from "@/components/landing/about-section";
import { CategoriesSection } from "@/components/landing/categories-section";
import { CraftsmanshipSection } from "@/components/landing/craftsmanship-section";
import { CtaSection } from "@/components/landing/cta-section";
import { ChicoutimiWeather } from "@/components/landing/chicoutimi-weather";
import { Hero } from "@/components/landing/hero";
import { ProductsShowcase } from "@/components/landing/products-showcase";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

type SearchParams = {
  q?: string;
  category?: string;
  sort?: string;
};

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) ?? {};
  return (
    <>
      <Header />
      <main>
        <ChicoutimiWeather />
        <Hero />
        <ProductsShowcase searchParams={sp} />
        <CategoriesSection />
        <CraftsmanshipSection />
        <AboutSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
