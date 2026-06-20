import type { Product } from "../types/product";
import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";

interface ProductShowcaseProps {
  products: Product[];
  loading: boolean;
  error: string | null;
}

export default function ProductShowcase({ products, loading, error }: ProductShowcaseProps) {
  return (
    <section id="products" className="scroll-mt-20 px-6 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center md:text-left">
          <p className="text-sm font-medium uppercase tracking-wider text-sage-500">Our catalog</p>
          <h2 className="font-display mt-2 text-3xl font-semibold text-forest-800 md:text-4xl">
            Shop sustainable essentials
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-stone-600 md:mx-0">
            {products.length > 0
              ? `${products.length} plastic-free products for your daily routine — bamboo oral care, shampoo bars, and refillable cleaners.`
              : "Biodegradable bamboo toothbrushes, zero-waste shampoo bars, and refillable household cleaners."}
          </p>
          <a
            href="/catalog"
            className="mt-4 inline-block text-sm font-medium text-forest-600 hover:text-forest-700"
          >
            Search & filter full catalog →
          </a>
        </div>

        {loading && (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-80 animate-pulse rounded-2xl bg-forest-100/60"
                aria-hidden
              />
            ))}
          </div>
        )}

        {error && (
          <p className="mt-12 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
            {error}
          </p>
        )}

        {!loading && !error && products.length > 0 && (
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <li key={product.id}>
                <Link to={`/products/${product.slug}`}>
                  <ProductCard product={product} linkable />
                </Link>
              </li>
            ))}
          </ul>
        )}

        {!loading && !error && products.length === 0 && (
          <p className="mt-12 text-center text-stone-600">No products available yet.</p>
        )}
      </div>
    </section>
  );
}
