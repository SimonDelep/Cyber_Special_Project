import Link from "next/link";
import type { Product } from "../../../generated/prisma/client";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { formatPrice } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/shop/constants";

type FeaturedProductsProps = {
  products: Product[];
};

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  return (
    <section id="featured" className="border-y border-white/10 bg-slate-900/40 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Featured products
        </h2>
        <p className="mt-3 text-slate-400">
          {products.length > 0
            ? "Hand-picked favorites from our catalog."
            : "Run the database seed to load sample products."}
        </p>
        {products.length > 0 ? (
          <Link
            href="/shop"
            className="mt-4 inline-block text-sm font-medium text-brand-400 hover:text-brand-300"
          >
            View full catalog with search & filters →
          </Link>
        ) : null}
        {products.length > 0 ? (
          <ul className="mt-12 grid gap-6 sm:grid-cols-3">
            {products.map((product) => (
              <li
                key={product.id}
                className="flex flex-col rounded-2xl border border-white/10 bg-slate-950/60 p-6"
              >
                <span className="text-xs font-medium uppercase tracking-wide text-brand-400">
                  {CATEGORY_LABELS[product.category]}
                </span>
                <Link
                  href={`/shop/${product.slug}`}
                  className="mt-2 block text-lg font-semibold text-white hover:text-brand-300"
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
        ) : (
          <div className="mt-12 rounded-2xl border border-dashed border-white/20 p-12 text-center text-slate-500">
            <p className="font-mono text-sm">
              npm run db:up && npm run db:migrate && npm run db:seed
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
