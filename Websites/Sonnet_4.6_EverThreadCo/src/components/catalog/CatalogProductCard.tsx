import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { StarRating } from "@/components/ui/StarRating";
import { formatPrice } from "@/lib/format";
import { productAccent } from "@/lib/products/accent";

export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  imageUrl: string | null;
  inStock: boolean;
  featured: boolean;
  category: { name: string; slug: string };
  averageRating: number | null;
  reviewCount: number;
};

export function CatalogProductCard({ product }: { product: CatalogProduct }) {
  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-sand-200 bg-cream-50 transition-shadow hover:shadow-md">
      <Link href={`/catalog/${product.slug}`} className="block">
        <div
          className={`relative aspect-[4/5] bg-gradient-to-br ${productAccent(product.slug)}`}
        >
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 25vw"
              unoptimized={product.imageUrl.startsWith("/uploads/")}
            />
          ) : null}
          {product.featured ? (
            <span className="absolute left-3 top-3 rounded-full bg-sage-700/90 px-3 py-1 text-xs font-medium text-cream-50">
              Featured
            </span>
          ) : null}
          {!product.inStock ? (
            <span className="absolute right-3 top-3 rounded-full bg-sand-900/80 px-3 py-1 text-xs font-medium text-cream-50">
              Out of stock
            </span>
          ) : null}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-sage-700">
          {product.category.name}
        </p>
        <Link href={`/catalog/${product.slug}`}>
          <h3 className="mt-1 font-display text-lg leading-snug text-sand-900 hover:text-sage-800">
            {product.name}
          </h3>
        </Link>
        {product.reviewCount > 0 && product.averageRating !== null ? (
          <div className="mt-2 flex items-center gap-2">
            <StarRating rating={product.averageRating} />
            <span className="text-xs text-sand-500">
              ({product.reviewCount})
            </span>
          </div>
        ) : (
          <p className="mt-2 text-xs text-sand-500">No reviews yet</p>
        )}
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-sand-600">
          {product.description}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-sand-900">
            {formatPrice(product.priceCents)}
          </span>
          <Link
            href={`/catalog/${product.slug}`}
            className="text-xs font-medium text-sage-700 hover:text-sage-900"
          >
            View details →
          </Link>
        </div>
        <AddToCartButton
          productId={product.id}
          inStock={product.inStock}
          className="mt-4"
        />
      </div>
    </li>
  );
}
