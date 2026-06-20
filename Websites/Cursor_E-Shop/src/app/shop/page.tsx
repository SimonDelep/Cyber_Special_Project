import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { StarRating } from "@/components/reviews/StarRating";
import { ProductImage } from "@/components/ui/ProductImage";
import { Alert } from "@/components/ui/Alert";
import { getReviewStats } from "@/lib/reviews";
import { queryDb } from "@/lib/db-query";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

interface ShopPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { error } = await searchParams;
  const productsResult = await queryDb(() =>
    prisma.product.findMany({
      orderBy: { name: "asc" },
      include: { reviews: { select: { rating: true } } },
    })
  );
  const products = productsResult.data ?? [];

  return (
    <div className="flex min-h-full flex-col bg-zinc-950 text-zinc-100">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight">Shop</h1>
        <p className="mt-2 text-zinc-400">
          Browse our catalog and add items to your cart.
        </p>

        {productsResult.dbError ? (
          <div className="mt-6">
            <Alert>{productsResult.dbError}</Alert>
          </div>
        ) : null}

        {error === "out-of-stock" ? (
          <div className="mt-6">
            <Alert>This product is currently out of stock.</Alert>
          </div>
        ) : null}

        {!productsResult.dbError && products.length === 0 ? (
          <p className="mt-12 text-center text-zinc-500">No products available.</p>
        ) : (
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const reviewStats = getReviewStats(
                product.reviews.map((r) => r.rating)
              );

              return (
              <li key={product.id}>
                <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
                  <Link
                    href={`/shop/${product.slug}`}
                    className="relative aspect-[4/3] bg-zinc-950 block"
                  >
                    {product.imageUrl ? (
                      <ProductImage src={product.imageUrl} alt={product.name} />
                    ) : (
                      <div className="flex h-full items-center justify-center text-5xl text-zinc-700">
                        📦
                      </div>
                    )}
                  </Link>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                      {product.category}
                    </p>
                    <Link href={`/shop/${product.slug}`}>
                      <h2 className="mt-1 text-lg font-semibold transition group-hover:text-cyan-300">
                        {product.name}
                      </h2>
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
                        <span className="text-xs text-zinc-500">
                          {product.stock != null
                            ? `${product.stock} in stock`
                            : "In stock"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Link
                          href={`/shop/${product.slug}`}
                          className="inline-flex flex-1 items-center justify-center rounded-full border border-zinc-600 px-4 py-2 text-center text-sm font-medium text-zinc-200 transition hover:border-zinc-400"
                        >
                          View & review
                        </Link>
                        <AddToCartButton productId={product.id} className="flex-1" />
                      </div>
                    </div>
                  </div>
                </article>
              </li>
            );
            })}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
}
