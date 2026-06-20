import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { CATEGORY_EMOJI, CATEGORY_LABELS } from "@/lib/constants";
import { AddToCartButton } from "@/components/cart/AddToCartButton";

export async function FeaturedProducts() {
  let products: Awaited<ReturnType<typeof prisma.product.findMany>> = [];

  try {
    products = await prisma.product.findMany({
      orderBy: [{ category: "asc" }, { price: "desc" }],
    });
  } catch {
    // Database may be unavailable during first setup
  }

  if (products.length === 0) {
    return (
      <section id="products" className="scroll-mt-20 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Our products
          </h2>
          <p className="mt-4 text-muted">Catalog loading soon. Check back shortly.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="products" className="scroll-mt-20 px-6 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Our products
          </h2>
          <p className="mt-3 text-muted">
            {products.length} premium travel tech essentials, ready to power your
            next trip.
          </p>
          <Link
            href="/products"
            className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
          >
            Browse full catalog with search & filters →
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-shadow hover:shadow-lg"
            >
              <div className="flex h-36 items-center justify-center bg-gradient-to-br from-accent/10 to-border/30 text-5xl transition-transform group-hover:scale-[1.02]">
                {CATEGORY_EMOJI[product.category] ?? "📦"}
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-snug">{product.name}</h3>
                  {product.featured && (
                    <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                      Popular
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted">
                  {CATEGORY_LABELS[product.category] ?? product.category}
                </p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted line-clamp-3">
                  {product.description}
                </p>
                <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                  <p className="text-lg font-semibold text-accent">
                    {formatPrice(product.price)}
                  </p>
                  <span
                    className={
                      product.inStock
                        ? "text-xs font-medium text-green-600"
                        : "text-xs font-medium text-muted"
                    }
                  >
                    {product.inStock ? "In stock" : "Out of stock"}
                  </span>
                </div>
                <AddToCartButton
                  productId={product.id}
                  inStock={product.inStock}
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
