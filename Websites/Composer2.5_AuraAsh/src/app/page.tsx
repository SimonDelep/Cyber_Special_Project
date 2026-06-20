import { ProductCatalog } from "@/components/catalog/ProductCatalog";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { DailyInspirationSection } from "@/components/home/DailyInspirationSection";
import { Features } from "@/components/home/Features";
import { Hero } from "@/components/home/Hero";
import { Newsletter } from "@/components/home/Newsletter";
import { getAllProducts } from "@/lib/products";

export default async function HomePage() {
  const products = await getAllProducts();

  return (
    <>
      <Hero />
      <ProductCatalog
        products={products}
        title="Our handcrafted collection"
        subtitle="Search and filter candles, incense holders, and diffusers made in small batches."
      />
      <CategoryGrid />
      <DailyInspirationSection />
      <Features />
      <Newsletter />
    </>
  );
}
