import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { CATEGORY_EMOJI, CATEGORY_LABELS } from "@/lib/constants";
import { AddToCartButton } from "@/components/cart/AddToCartButton";

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  category: string;
  featured: boolean;
  inStock: boolean;
  reviewCount: number;
  avgRating: number | null;
};

export function ProductCard({ product }: { product: CatalogProduct }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-shadow hover:shadow-lg">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="flex h-36 items-center justify-center bg-gradient-to-br from-accent/10 to-border/30 text-5xl">
          {CATEGORY_EMOJI[product.category] ?? "📦"}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-6">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold leading-snug hover:text-accent">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted">
          {CATEGORY_LABELS[product.category] ?? product.category}
        </p>
        {product.avgRating !== null && (
          <p className="mt-2 text-sm text-muted">
            ★ {product.avgRating} ({product.reviewCount}{" "}
            {product.reviewCount === 1 ? "review" : "reviews"})
          </p>
        )}
        <p className="mt-2 flex-1 text-sm text-muted line-clamp-2">
          {product.description}
        </p>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <p className="text-lg font-semibold text-accent">
            {formatPrice(product.price)}
          </p>
          <span
            className={
              product.inStock
                ? "text-xs font-medium text-green-600"
                : "text-xs text-muted"
            }
          >
            {product.inStock ? "In stock" : "Out of stock"}
          </span>
        </div>
        <AddToCartButton productId={product.id} inStock={product.inStock} />
      </div>
    </article>
  );
}
