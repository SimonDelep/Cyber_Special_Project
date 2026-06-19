import Link from "next/link";
import type { Product } from "../../../generated/prisma/client";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { formatPrice } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/shop/constants";

type ProductGridProps = {
  products: Product[];
};

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <p className="text-center text-slate-500">No products available yet.</p>
    );
  }

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <li
          key={product.id}
          className="flex flex-col rounded-2xl border border-white/10 bg-slate-900/60 p-6"
        >
          <span className="text-xs font-medium uppercase tracking-wide text-brand-400">
            {CATEGORY_LABELS[product.category]}
          </span>
          <Link
            href={`/shop/${product.slug}`}
            className="mt-2 text-lg font-semibold text-white transition hover:text-brand-300"
          >
            {product.name}
          </Link>
          <p className="mt-2 flex-1 text-sm text-slate-400">{product.description}</p>
          <p className="mt-4 text-lg font-semibold text-white">
            {formatPrice(product.priceCents)}
          </p>
          <AddToCartButton productId={product.id} disabled={!product.inStock} />
        </li>
      ))}
    </ul>
  );
}
