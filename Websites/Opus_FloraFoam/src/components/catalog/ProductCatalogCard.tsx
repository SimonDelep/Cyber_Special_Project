import Image from "next/image";
import Link from "next/link";
import { StarRating } from "@/components/reviews/StarRating";
import { CATEGORY_LABELS, formatPrice } from "@/types/product";
import type { ProductCategory } from "@prisma/client";

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: ProductCategory;
  priceCents: number;
  imageUrl: string | null;
  inStock: boolean;
  reviewCount: number;
  averageRating: number | null;
};

export function ProductCatalogCard({ product }: { product: CatalogProduct }) {
  return (
    <li className="group flex flex-col overflow-hidden rounded-2xl border border-sage-200/80 bg-cream-50 transition-shadow hover:shadow-md">
      <Link href={`/products/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-sage-100">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-sage-100 via-rose-200/40 to-sage-200 text-sm text-sage-500">
            No image
          </div>
        )}
        <span className="absolute bottom-4 left-4 rounded-full bg-cream-50/95 px-3 py-1 text-xs font-medium uppercase tracking-wide text-sage-700">
          {CATEGORY_LABELS[product.category]}
        </span>
        {!product.inStock && (
          <span className="absolute top-4 right-4 rounded-full bg-sage-800/90 px-3 py-1 text-xs font-medium text-cream-50">
            Out of stock
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-display text-lg font-semibold text-sage-900 hover:text-sage-700">
            {product.name}
          </h3>
        </Link>
        {product.averageRating != null && (
          <div className="mt-2 flex items-center gap-2">
            <StarRating rating={product.averageRating} size="sm" />
            <span className="text-xs text-sage-500">
              {product.averageRating} ({product.reviewCount}{" "}
              {product.reviewCount === 1 ? "review" : "reviews"})
            </span>
          </div>
        )}
        {product.reviewCount === 0 && (
          <p className="mt-2 text-xs text-sage-500">No reviews yet</p>
        )}
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-sage-600">{product.description}</p>
        <p className="mt-3 font-medium text-sage-800">{formatPrice(product.priceCents)}</p>
        <Link
          href={`/products/${product.slug}`}
          className="mt-4 block w-full rounded-full border border-sage-300 py-2.5 text-center text-sm font-medium text-sage-800 transition-colors hover:border-sage-500 hover:bg-sage-50"
        >
          View details
        </Link>
      </div>
    </li>
  );
}
