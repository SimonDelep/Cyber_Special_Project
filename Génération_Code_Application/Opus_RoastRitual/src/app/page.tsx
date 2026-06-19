import { Chicoutimi } from "@/components/landing/Chicoutimi";
import { Features } from "@/components/landing/Features";
import { Hero } from "@/components/landing/Hero";
import { Newsletter } from "@/components/landing/Newsletter";
import { ProductGrid } from "@/components/landing/ProductGrid";
import { Story } from "@/components/landing/Story";
import { SubscriptionPreview } from "@/components/landing/SubscriptionPreview";
import { getActiveProducts } from "@/lib/products";

export default async function HomePage() {
  const products = await getActiveProducts();

  return (
    <>
      <Hero />
      <Features />
      <ProductGrid products={products} />
      <SubscriptionPreview />
      <Story />
      <Chicoutimi />
      <Newsletter />
    </>
  );
}
