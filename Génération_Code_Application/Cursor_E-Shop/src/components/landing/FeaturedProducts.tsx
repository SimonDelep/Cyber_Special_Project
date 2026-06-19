import Link from "next/link";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { ProductSearchBar } from "@/components/landing/ProductSearchBar";
import { StarRating } from "@/components/reviews/StarRating";
import { ProductImage } from "@/components/ui/ProductImage";
import type { ProductSearchParams } from "@/lib/product-filters";
import { getReviewStats } from "@/lib/reviews";
import { formatPrice } from "@/lib/utils";

export type FeaturedProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: { toString(): string };
  imageUrl: string | null;
  category: string;
  reviews: { rating: number }[];
};

interface FeaturedProductsProps {
  products: FeaturedProduct[];
  searchParams: ProductSearchParams;
  hasFilters: boolean;
}

export function FeaturedProducts({
  products,
  searchParams,
  hasFilters,
}: FeaturedProductsProps) {
  const heading = hasFilters ? "Search results" : "Featured products";
  const subtitle = hasFilters
    ? products.length === 0
      ? "No products match your filters. Try adjusting search or price range."
      : `${products.length} product${products.length === 1 ? "" : "s"} found`
    : "Top picks from our current inventory — or search and filter below.";

  return (
    <section id="featured" className="border-t border-zinc-800 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{heading}</h2>
            <p className="mt-2 text-zinc-400">{subtitle}</p>
          </div>
          <Link
            href="/shop"
            className="text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
          >
            View full shop →
          </Link>
        </div>

        <div className="mt-8">
          <ProductSearchBar values={searchParams} hasFilters={hasFilters} />
        </div>

        {products.length === 0 ? (
          <p className="mt-12 text-center text-zinc-500">
            {hasFilters
              ? "No matching products. Clear filters or browse categories below."
              : "Our catalog is being stocked. Check back soon or browse categories below."}
          </p>
        ) : (
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const reviewStats = getReviewStats(
                product.reviews.map((r) => r.rating)
              );

              return (
                <li key={product.id}>
                  <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 transition hover:border-zinc-600 hover:bg-zinc-900/70">
                    <Link
                      href={`/shop/${product.slug}`}
                      className="relative block aspect-[4/3] overflow-hidden bg-zinc-950"
                    >
                      {product.imageUrl ? (
                        <ProductImage src={product.imageUrl} alt={product.name} />
                      ) : (
                        <div className="flex h-full items-center justify-center text-5xl text-zinc-700">
                          📦
                        </div>
                      )}
                      <span className="absolute left-3 top-3 rounded-full bg-zinc-950/80 px-2.5 py-1 text-xs font-medium capitalize text-zinc-300 backdrop-blur-sm">
                        {product.category}
                      </span>
                    </Link>
                    <div className="flex flex-1 flex-col p-5">
                      <Link href={`/shop/${product.slug}`}>
                        <h3 className="text-lg font-semibold text-zinc-50 transition group-hover:text-cyan-300">
                          {product.name}
                        </h3>
                      </Link>
                      {reviewStats.count > 0 ? (
                        <div className="mt-2 flex items-center gap-2">
                          <StarRating rating={reviewStats.average} size="sm" />
                          <span className="text-xs text-zinc-500">
                            ({reviewStats.count})
                          </span>
                        </div>
                      ) : null}
                      {product.description ? (
                        <p className="mt-2 line-clamp-2 text-sm text-zinc-500">
                          {product.description}
                        </p>
                      ) : null}
                      <div className="mt-auto flex flex-col gap-3 pt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-bold text-cyan-400">
                            {formatPrice(Number(product.price.toString()))}
                          </span>
                          <span className="text-xs text-zinc-600">In stock</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Link
                            href={`/shop/${product.slug}`}
                            className="inline-flex items-center justify-center rounded-full border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-400"
                          >
                            Reviews
                          </Link>
                          <AddToCartButton productId={product.id} className="w-full" />
                        </div>
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
