import Link from "next/link";
import { ProductCard } from "@/components/home/ProductCard";
import type { ProductItem } from "@/types";

interface FeaturedProductsProps {
  products: ProductItem[];
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage">
            Shop
          </p>
          <h2 className="mt-3 font-display text-4xl font-medium text-charcoal">
            Our handcrafted collection
          </h2>
          <p className="mt-2 max-w-lg text-sm text-stone">
            Hand-poured candles, sculptural incense holders, and essential oil
            diffusers — each made in small batches with care.
          </p>
        </div>
        <Link
          href="/shop"
          className="shrink-0 rounded-full border border-stone/30 px-6 py-2.5 text-sm font-medium text-charcoal transition-colors hover:border-charcoal"
        >
          View all products
        </Link>
      </div>

      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
