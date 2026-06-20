import { useEffect, useState } from "react";
import { fetchHealth, fetchProducts } from "../api/client";
import CategoryCards from "../components/CategoryCards";
import Hero from "../components/Hero";
import ProductShowcase from "../components/ProductShowcase";
import WeatherChicoutimi from "../components/WeatherChicoutimi";
import type { Product } from "../types/product";

export default function HomePage() {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHealth()
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false));

    fetchProducts()
      .then((data) => {
        setProducts(data);
        setError(null);
      })
      .catch(() =>
        setError("Could not load products. Start the API and database, then refresh.")
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {apiOnline === false && (
        <div
          className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900"
          role="status"
        >
          API offline — run the backend to see live product data.
        </div>
      )}
      <div className="mx-auto max-w-6xl px-6 pt-8">
        <WeatherChicoutimi />
      </div>
      <Hero products={products} loading={loading} />
      <ProductShowcase products={products} loading={loading} error={error} />
      <CategoryCards />
    </>
  );
}
