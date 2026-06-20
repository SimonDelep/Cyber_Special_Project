import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { ReviewForm, ReviewSignInPrompt } from "@/components/reviews/ReviewForm";
import { ReviewList } from "@/components/reviews/ReviewList";
import { getSessionUser } from "@/lib/auth/session";
import { formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { toPublicReview, toPublicReviews } from "@/lib/reviews/serializers";
import { CATEGORY_LABELS } from "@/lib/shop/constants";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
  });

  if (!product) notFound();

  const sessionUser = await getSessionUser();

  const reviews = await prisma.review.findMany({
    where: { productId: product.id },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  const publicReviews = toPublicReviews(reviews);

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

  let existingReview = null;
  if (sessionUser) {
    const mine = reviews.find((r) => r.userId === sessionUser.id);
    if (mine) existingReview = toPublicReview(mine);
  }

  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <Link href="/shop" className="text-sm text-brand-400 hover:text-brand-300">
          ← Back to catalog
        </Link>

        <article className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-8">
          <span className="text-xs font-medium uppercase tracking-wide text-brand-400">
            {CATEGORY_LABELS[product.category]}
          </span>
          <h1 className="mt-2 text-3xl font-bold text-white">{product.name}</h1>
          <p className="mt-4 text-slate-300">{product.description}</p>
          <p className="mt-6 text-2xl font-semibold text-white">
            {formatPrice(product.priceCents)}
          </p>
          {!product.inStock ? (
            <p className="mt-2 text-sm text-amber-400">Currently out of stock</p>
          ) : null}
          <div className="mt-6 max-w-xs">
            <AddToCartButton productId={product.id} disabled={!product.inStock} />
          </div>
        </article>

        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Customer reviews</h2>
              <p className="mt-1 text-slate-400">
                {reviews.length === 0
                  ? "No ratings yet"
                  : `${reviews.length} review${reviews.length !== 1 ? "s" : ""}${
                      avgRating !== null
                        ? ` · ${avgRating.toFixed(1)} average`
                        : ""
                    }`}
              </p>
            </div>
          </div>

          <div className="mt-8">
            {sessionUser ? (
              <ReviewForm productId={product.id} existingReview={existingReview} />
            ) : (
              <ReviewSignInPrompt />
            )}
          </div>

          <div className="mt-10">
            <ReviewList reviews={publicReviews} />
          </div>
        </section>
      </div>
    </div>
  );
}
