import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";
import { StarRating } from "@/components/reviews/StarRating";
import { getCurrentUser } from "@/lib/auth";
import { categoryAccents, categoryLabels } from "@/lib/products";
import { prisma } from "@/lib/prisma";
import {
  getAverageRating,
  getProductReviews,
  getUserReviewForProduct,
} from "@/lib/reviews";
import { decimalToNumber, formatPrice } from "@/lib/utils";
import type { ProductItem } from "@/types";

type PageProps = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!slug) return { title: "Product Not Found" };

  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) return { title: "Product Not Found" };
  return { title: product.name };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  if (!slug) notFound();

  const [product, user] = await Promise.all([
    prisma.product.findUnique({ where: { slug } }),
    getCurrentUser(),
  ]);

  if (!product) notFound();

  let reviews: Awaited<ReturnType<typeof getProductReviews>> = [];
  let userReview: Awaited<ReturnType<typeof getUserReviewForProduct>> = null;

  try {
    [reviews, userReview] = await Promise.all([
      getProductReviews(product.id),
      user ? getUserReviewForProduct(product.id, user.id) : Promise.resolve(null),
    ]);
  } catch {
    reviews = [];
    userReview = null;
  }
  const averageRating = getAverageRating(reviews);

  const price = decimalToNumber(product.price);
  const accent = categoryAccents[product.category];
  const productItem: ProductItem = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price,
    category: product.category,
    imageUrl: product.imageUrl,
    inStock: product.inStock,
    featured: product.featured,
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <Link
        href="/shop"
        className="text-sm text-stone transition-colors hover:text-ember"
      >
        &larr; Back to shop
      </Link>

      <div className="mt-8 grid gap-12 lg:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-2xl bg-cream">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="size-full object-cover"
            />
          ) : (
            <div
              className={`flex size-full flex-col items-center justify-center bg-gradient-to-br ${accent}`}
            >
              <div className="size-24 rounded-full bg-warm-white/40 backdrop-blur-sm" />
              <p className="mt-6 font-display text-2xl text-charcoal/80">
                {categoryLabels[product.category]}
              </p>
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-sage">
            {categoryLabels[product.category]}
          </p>
          <h1 className="mt-2 font-display text-4xl font-medium text-charcoal">
            {product.name}
          </h1>
          {averageRating !== null && (
            <div className="mt-3 flex items-center gap-2">
              <StarRating rating={averageRating} size="sm" />
              <span className="text-sm text-stone">
                {averageRating} ({reviews.length}{" "}
                {reviews.length === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}
          <p className="mt-4 text-2xl font-medium text-charcoal">
            {formatPrice(price)}
          </p>
          <p className="mt-6 leading-relaxed text-stone">{product.description}</p>
          <p className="mt-4 text-sm text-stone">
            {product.inStock ? (
              <span className="text-sage">In stock</span>
            ) : (
              <span className="text-ember">Out of stock</span>
            )}
          </p>
          <AddToCartButton product={productItem} />
        </div>
      </div>

      <ReviewsSection
        productId={product.id}
        productSlug={product.slug}
        reviews={reviews}
        user={user}
        userReview={userReview}
      />
    </div>
  );
}
