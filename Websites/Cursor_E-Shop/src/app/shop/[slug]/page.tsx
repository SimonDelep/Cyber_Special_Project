import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { ReviewList } from "@/components/reviews/ReviewList";
import { StarRating } from "@/components/reviews/StarRating";
import { ProductImage } from "@/components/ui/ProductImage";
import { auth } from "@/auth";
import { getReviewStats, formatReviewAverage } from "@/lib/reviews";
import { Alert } from "@/components/ui/Alert";
import { queryDb } from "@/lib/db-query";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const session = await auth();

  const productResult = await queryDb(() =>
    prisma.product.findUnique({
      where: { slug },
      include: {
        reviews: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    })
  );

  if (productResult.dbError) {
    return (
      <div className="flex min-h-full flex-col bg-zinc-950 text-zinc-100">
        <Header />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6">
          <Alert>{productResult.dbError}</Alert>
          <Link
            href="/shop"
            className="mt-6 inline-flex text-sm font-medium text-cyan-400 hover:text-cyan-300"
          >
            ← Back to shop
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const product = productResult.data;

  if (!product) {
    notFound();
  }

  const stats = getReviewStats(product.reviews.map((r) => r.rating));
  const userReview =
    session?.user?.id != null
      ? product.reviews.find((r) => r.userId === session.user.id) ?? null
      : null;

  return (
    <div className="flex min-h-full flex-col bg-zinc-950 text-zinc-100">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6">
        <Link
          href="/shop"
          className="text-sm text-zinc-500 transition hover:text-zinc-300"
        >
          ← Back to shop
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
            {product.imageUrl ? (
              <ProductImage src={product.imageUrl} alt={product.name} />
            ) : (
              <div className="flex h-full items-center justify-center text-8xl text-zinc-700">
                📦
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-cyan-400/90">
              {product.category}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{product.name}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {stats.count > 0 ? (
                <>
                  <StarRating rating={stats.average} />
                  <span className="text-sm text-zinc-400">
                    {formatReviewAverage(stats.average, stats.count)}
                  </span>
                </>
              ) : (
                <span className="text-sm text-zinc-500">No reviews yet</span>
              )}
            </div>

            <p className="mt-6 text-3xl font-bold text-cyan-400">
              {formatPrice(Number(product.price.toString()))}
            </p>

            {product.description ? (
              <p className="mt-4 leading-relaxed text-zinc-400">{product.description}</p>
            ) : null}

            <p className="mt-2 text-sm text-zinc-500">
              {product.stock != null
                ? `${product.stock} units in stock`
                : "In stock"}
            </p>

            <div className="mt-8">
              <AddToCartButton productId={product.id} />
            </div>
          </div>
        </div>

        <section className="mt-16 border-t border-zinc-800 pt-12">
          <h2 className="text-2xl font-bold tracking-tight">Customer reviews</h2>
          <div className="mt-8 grid gap-10 lg:grid-cols-2">
            <ReviewForm
              productId={product.id}
              isLoggedIn={!!session?.user}
              existingReview={
                userReview
                  ? {
                      rating: userReview.rating,
                      comment: userReview.comment,
                      imageUrl: userReview.imageUrl,
                    }
                  : null
              }
            />
            <div>
              <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500">
                All reviews ({stats.count})
              </h3>
              <ReviewList reviews={product.reviews} />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
