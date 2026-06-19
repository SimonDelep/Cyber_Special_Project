import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { formatPrice } from "@/lib/utils";
import { CATEGORY_EMOJI, CATEGORY_LABELS } from "@/lib/constants";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { ReviewForm } from "@/components/products/ReviewForm";
import { ReviewList, type ReviewItem } from "@/components/products/ReviewList";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { name: true },
  });
  return { title: product?.name ?? "Product" };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const currentUser = await getCurrentUser();

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      reviews: {
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, username: true, profilePicture: true },
          },
        },
      },
    },
  });

  if (!product) notFound();

  const ratings = product.reviews.map((r) => r.rating);
  const avgRating =
    ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) /
        10
      : null;

  const hasExistingReview = currentUser
    ? product.reviews.some((r) => r.userId === currentUser.id)
    : false;

  const reviews: ReviewItem[] = product.reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    content: r.content,
    imageUrl: r.imageUrl,
    createdAt: r.createdAt.toISOString(),
    user: r.user,
  }));

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <Link
        href="/products"
        className="text-sm text-muted transition-colors hover:text-accent"
      >
        ← Back to catalog
      </Link>

      <div className="mt-8 grid gap-10 md:grid-cols-2">
        <div className="flex h-64 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/10 to-border/30 text-8xl md:h-80">
          {CATEGORY_EMOJI[product.category] ?? "📦"}
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {CATEGORY_LABELS[product.category]}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{product.name}</h1>
          {avgRating !== null && (
            <p className="mt-2 text-sm text-muted">
              ★ {avgRating} · {product.reviews.length}{" "}
              {product.reviews.length === 1 ? "review" : "reviews"}
            </p>
          )}
          <p className="mt-4 text-2xl font-semibold text-accent">
            {formatPrice(product.price)}
          </p>
          <p className="mt-2 text-sm">
            {product.inStock ? (
              <span className="text-green-600 font-medium">In stock</span>
            ) : (
              <span className="text-muted">Out of stock</span>
            )}
          </p>
          <p className="mt-6 leading-relaxed text-muted">{product.description}</p>
          <div className="mt-8 max-w-xs">
            <AddToCartButton productId={product.id} inStock={product.inStock} />
          </div>
        </div>
      </div>

      <section className="mt-16 border-t border-border pt-16">
        <h2 className="text-2xl font-bold tracking-tight">Customer reviews</h2>
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
          <ReviewList
            reviews={reviews}
            currentUserId={currentUser?.id}
          />
          <ReviewForm
            productSlug={slug}
            isLoggedIn={!!currentUser}
            hasExistingReview={hasExistingReview}
          />
        </div>
      </section>
    </div>
  );
}
