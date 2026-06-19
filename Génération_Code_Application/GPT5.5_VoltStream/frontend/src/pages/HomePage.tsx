import CategoryCards from "../components/CategoryCards";
import Hero from "../components/Hero";
import ProductShowcase from "../components/ProductShowcase";
import QuoteDisplay from "../components/QuoteDisplay";

export default function HomePage() {
  return (
    <>
      <Hero />
      <QuoteDisplay />
      <ProductShowcase />
      <CategoryCards />
    </>
  );
}
