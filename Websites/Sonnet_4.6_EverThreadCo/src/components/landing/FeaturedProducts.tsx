import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { Button } from "@/components/ui/Button";
import type { Product } from "@/generated/prisma/client";
import { formatPrice } from "@/lib/format";
import { productAccent } from "@/lib/products/accent";

type ShopProduct = Pick<
  Product,
  "id" | "name" | "slug" | "description" | "priceCents" | "imageUrl" | "inStock"
>;

type FeaturedProductsProps = {
  products: ShopProduct[];
};

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  return (
    <section id="shop" className="py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-sage-700">
              Shop
            </p>
            <h2 className="mt-3 font-display text-3xl text-sand-900 md:text-4xl">
              Timeless essentials
            </h2>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <p className="max-w-md text-sm text-sand-600 sm:text-right">
              Six wardrobe staples woven from certified organic Egyptian cotton
              and recycled fibers.
            </p>
            <Button href="/catalog" variant="secondary">
              Browse full catalog
            </Button>
          </div>
        </div>

        {products.length === 0 ? (
          <p className="mt-12 rounded-2xl border border-dashed border-sand-300 bg-cream-50 p-10 text-center text-sand-600">
            No products yet. Run{" "}
            <code className="rounded bg-sand-100 px-1.5 py-0.5 text-sm">
              npm run db:seed
            </code>{" "}
            after starting the database.
          </p>
        ) : (
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <li
                key={product.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-sand-200 bg-cream-50 transition-shadow hover:shadow-md"
              >
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
                      sizes="(max-width: 768px) 100vw, 33vw"
                      unoptimized={product.imageUrl.startsWith("/uploads/")}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-end p-5">
                      <span className="rounded-full bg-cream-50/90 px-3 py-1 text-xs font-medium text-sand-700 backdrop-blur-sm">
                        Organic · Recycled
                      </span>
                    </div>
                  )}
                  {!product.inStock ? (
                    <span className="absolute right-3 top-3 rounded-full bg-sand-900/80 px-3 py-1 text-xs font-medium text-cream-50">
                      Out of stock
                    </span>
                  ) : null}
                </div>
                </Link>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/catalog/${product.slug}`}>
                    <h3 className="font-display text-lg leading-snug text-sand-900 hover:text-sage-800">
                      {product.name}
                    </h3>
                    </Link>
                    <span className="shrink-0 text-sm font-semibold text-sand-800">
                      {formatPrice(product.priceCents)}
                    </span>
                  </div>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-sand-600">
                    {product.description}
                  </p>
                  <AddToCartButton
                    productId={product.id}
                    inStock={product.inStock}
                    className="mt-4"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
