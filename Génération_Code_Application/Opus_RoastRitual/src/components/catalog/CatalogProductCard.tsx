import Image from "next/image";
import Link from "next/link";

import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { StarRating } from "@/components/reviews/StarRating";
import { formatCents } from "@/lib/format";
import type { ProductWithReviews } from "@/lib/products";

const categoryAccent: Record<ProductWithReviews["category"], string> = {
  COFFEE: "from-espresso via-espresso-light to-sage-dark",
  TEA: "from-sage-dark via-sage to-sage-light",
};

type CatalogProductCardProps = {
  product: ProductWithReviews;
};

export function CatalogProductCard({ product }: CatalogProductCardProps) {
  return (
    <li className="flex flex-col overflow-hidden rounded-3xl border border-sage/25 bg-cream shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative h-48 w-full overflow-hidden">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div
              className={`h-full w-full bg-gradient-to-br ${categoryAccent[product.category]}`}
            />
          )}
          <span className="absolute left-4 top-4 rounded-full bg-cream/90 px-3 py-1 text-xs font-medium uppercase tracking-wider text-espresso">
            {product.category === "COFFEE" ? "Coffee" : "Tea"}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-6">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-display text-xl text-espresso hover:text-sage-dark">
            {product.name}
          </h3>
        </Link>
        {(product.origin || product.roastLevel) && (
          <p className="mt-1 text-sm text-espresso/60">
            {[product.origin, product.roastLevel].filter(Boolean).join(" · ")}
          </p>
        )}
        {product.reviewCount > 0 && product.averageRating !== null && (
          <div className="mt-2 flex items-center gap-2 text-sm text-espresso/70">
            <StarRating rating={product.averageRating} />
            <span>
              {product.averageRating.toFixed(1)} ({product.reviewCount})
            </span>
          </div>
        )}
        <p className="mt-3 flex-1 text-sm leading-relaxed text-espresso/70 line-clamp-2">
          {product.description}
        </p>
        <p className="mt-4 text-2xl font-semibold text-espresso">
          {formatCents(product.priceCents)}
        </p>
        <AddToCartButton
          product={{
            productId: product.id,
            slug: product.slug,
            name: product.name,
            priceCents: product.priceCents,
            imageUrl: product.imageUrl,
          }}
        />
      </div>
    </li>
  );
}
