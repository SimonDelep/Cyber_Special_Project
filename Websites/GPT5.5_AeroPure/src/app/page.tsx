import { Hero } from "@/components/landing/Hero";
import { CategoryGrid } from "@/components/landing/CategoryGrid";
import { Features } from "@/components/landing/Features";
import { FeaturedProducts } from "@/components/landing/FeaturedProducts";
import { About } from "@/components/landing/About";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoryGrid />
      <FeaturedProducts />
      <Features />
      <About />
    </>
  );
}
