import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { ProductConnections } from "@/components/products/ProductConnections";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { ReviewList, type ReviewItem } from "@/components/reviews/ReviewList";
import { StarRating } from "@/components/ui/StarRating";
import { averageRating } from "@/lib/catalog/query";
import { getSession } from "@/lib/auth/session";
import { formatPrice } from "@/lib/format";
import { productAccent } from "@/lib/products/accent";
import { prisma } from "@/lib/prisma";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const [product, session] = await Promise.all([
    prisma.product.findUnique({
      where: { slug },
      include: {
        category: { select: { name: true, slug: true } },
        reviews: {
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    }),
    getSession(),
  ]);

  if (!product) {
    notFound();
  }

  const avg = averageRating(product.reviews);
  const userReview = session?.user
    ? product.reviews.find((r) => r.userId === session.user.id)
    : null;

  const reviews: ReviewItem[] = product.reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    imageUrl: r.imageUrl,
    createdAt: r.createdAt.toISOString(),
    user: r.user,
  }));

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <Link
        href="/catalog"
        className="text-sm font-medium text-sage-700 hover:text-sage-900"
      >
        ← Back to catalog
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div
          className={`relative aspect-[4/5] overflow-hidden rounded-2xl bg-gradient-to-br ${productAccent(product.slug)}`}
        >
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              priority
              unoptimized={product.imageUrl.startsWith("/uploads/")}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
              <span className="font-display text-2xl text-sand-700/80">
                {product.name}
              </span>
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-sage-700">
            {product.category.name}
          </p>
          <h1 className="mt-2 font-display text-4xl text-sand-900">
            {product.name}
          </h1>

          {avg !== null ? (
            <div className="mt-3 flex items-center gap-2">
              <StarRating rating={avg} size="md" />
              <span className="text-sm text-sand-600">
                {avg} · {product.reviews.length} review
                {product.reviews.length !== 1 ? "s" : ""}
              </span>
            </div>
          ) : (
            <p className="mt-3 text-sm text-sand-500">No reviews yet</p>
          )}

          <p className="mt-4 text-2xl font-semibold text-sand-900">
            {formatPrice(product.priceCents)}
          </p>

          <p className="mt-4 text-sm leading-relaxed text-sand-700">
            {product.description}
          </p>

          <p className="mt-2 text-sm text-sand-600">
            {product.inStock ? (
              <span className="text-sage-700">In stock</span>
            ) : (
              <span className="text-red-700">Out of stock</span>
            )}
            {product.featured ? " · Featured" : ""}
          </p>

          <AddToCartButton
            productId={product.id}
            inStock={product.inStock}
            className="mt-8 max-w-xs"
          />
        </div>
      </div>

      <ProductConnections
        productSlug={product.slug}
        productName={product.name}
      />

      <section className="mt-16 border-t border-sand-200 pt-16">
        <h2 className="font-display text-3xl text-sand-900">Customer reviews</h2>

        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <ReviewForm
            productId={product.id}
            productSlug={product.slug}
            existingReviewId={userReview?.id ?? null}
          />
          <div>
            <ReviewList reviews={reviews} />
          </div>
        </div>
      </section>
    </div>
  );
}
