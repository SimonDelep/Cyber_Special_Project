import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { ReviewList, type ReviewItem } from "@/components/reviews/ReviewList";
import { StarRating } from "@/components/reviews/StarRating";
import { auth } from "@/auth";
import { averageRating } from "@/lib/products/catalog-query";
import { prisma } from "@/lib/prisma";
import { CATEGORY_LABELS, formatPrice } from "@/types/product";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { name: true },
  });
  return {
    title: product ? `${product.name} | FloraFoam` : "Product | FloraFoam",
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await auth();

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      reviews: {
        include: {
          user: {
            select: {
              username: true,
              name: true,
              profileImageUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!product) {
    notFound();
  }

  const avgRating = averageRating(product.reviews);
  const userHasReviewed =
    session?.user?.id != null &&
    product.reviews.some((r) => r.userId === session.user.id);

  const reviews: ReviewItem[] = product.reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    imageUrl: r.imageUrl,
    createdAt: r.createdAt.toISOString(),
    user: {
      username: r.user.username,
      name: r.user.name,
      profileImageUrl: r.user.profileImageUrl,
    },
  }));

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <Link
        href="/products"
        className="text-sm font-medium text-sage-700 hover:text-sage-900"
      >
        ← Back to catalog
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-sage-100">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sage-500">No image</div>
          )}
        </div>

        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-sage-500">
            {CATEGORY_LABELS[product.category]}
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-sage-900">
            {product.name}
          </h1>

          {avgRating != null && (
            <div className="mt-3 flex items-center gap-2">
              <StarRating rating={avgRating} />
              <span className="text-sm text-sage-600">
                {avgRating} · {product.reviews.length}{" "}
                {product.reviews.length === 1 ? "review" : "reviews"}
              </span>
            </div>
          )}

          <p className="mt-4 text-2xl font-medium text-sage-800">
            {formatPrice(product.priceCents)}
          </p>

          <p className="mt-2 text-sm text-sage-600">
            {product.inStock ? (
              <span className="text-green-700">In stock</span>
            ) : (
              <span className="text-red-600">Out of stock</span>
            )}
          </p>

          <p className="mt-6 leading-relaxed text-sage-700">{product.description}</p>

          <div className="mt-8 max-w-sm">
            <AddToCartButton
              productId={product.id}
              productName={product.name}
              inStock={product.inStock}
              isLoggedIn={!!session?.user}
            />
          </div>
        </div>
      </div>

      <section className="mt-16 border-t border-sage-200/80 pt-16">
        <h2 className="font-display text-2xl font-semibold text-sage-900">Customer reviews</h2>

        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <div>
            {userHasReviewed ? (
              <div className="rounded-2xl border border-sage-200/80 bg-sage-50/50 p-6 text-sage-700">
                You have already reviewed this product.
              </div>
            ) : (
              <ReviewForm
                productId={product.id}
                isLoggedIn={!!session?.user}
                loginCallbackUrl={`/products/${product.slug}`}
              />
            )}
          </div>
          <div>
            <ReviewList reviews={reviews} />
          </div>
        </div>
      </section>
    </div>
  );
}
