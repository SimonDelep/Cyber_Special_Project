import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { ReviewList } from "@/components/reviews/ReviewList";
import { StarRating } from "@/components/reviews/StarRating";
import { auth } from "@/auth";
import { formatCents } from "@/lib/format";
import { getProductBySlug, getUserReviewForProduct } from "@/lib/products";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product | RoastRitual" };
  return {
    title: `${product.name} | RoastRitual`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const session = await auth();
  const existingReview =
    session?.user?.id
      ? await getUserReviewForProduct(session.user.id, product.id)
      : null;

  const categoryAccent =
    product.category === "COFFEE"
      ? "from-espresso via-espresso-light to-sage-dark"
      : "from-sage-dark via-sage to-sage-light";

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <Link
        href="/catalog"
        className="text-sm text-sage-dark hover:text-espresso"
      >
        ← Back to catalog
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-3xl border border-sage/25">
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
            <div
              className={`h-full w-full bg-gradient-to-br ${categoryAccent}`}
            />
          )}
        </div>

        <div>
          <p className="text-xs uppercase tracking-widest text-sage-dark">
            {product.category === "COFFEE" ? "Whole bean coffee" : "Loose-leaf tea"}
          </p>
          <h1 className="mt-2 font-display text-4xl text-espresso">
            {product.name}
          </h1>
          {(product.origin || product.roastLevel) && (
            <p className="mt-2 text-espresso/70">
              {[product.origin, product.roastLevel].filter(Boolean).join(" · ")}
            </p>
          )}
          {product.reviewCount > 0 && product.averageRating !== null && (
            <div className="mt-3 flex items-center gap-2">
              <StarRating rating={product.averageRating} size="md" />
              <span className="text-sm text-espresso/70">
                {product.averageRating.toFixed(1)} · {product.reviewCount}{" "}
                review{product.reviewCount !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          <p className="mt-6 text-3xl font-semibold text-espresso">
            {formatCents(product.priceCents)}
          </p>
          {product.isEthical && (
            <span className="mt-3 inline-block rounded-full bg-sage/20 px-3 py-1 text-xs font-medium text-sage-dark">
              Ethically sourced
            </span>
          )}
          <p className="mt-6 leading-relaxed text-espresso/80">
            {product.description}
          </p>
          <AddToCartButton
            product={{
              productId: product.id,
              slug: product.slug,
              name: product.name,
              priceCents: product.priceCents,
              imageUrl: product.imageUrl,
            }}
          />
        </div>
      </div>

      <section className="mt-16 border-t border-sage/20 pt-12">
        <h2 className="font-display text-2xl text-espresso">Customer reviews</h2>

        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium uppercase tracking-wider text-sage-dark">
              Write a review
            </h3>
            <div className="mt-4 rounded-3xl border border-sage/25 bg-linen p-6">
              <ReviewForm
                productSlug={product.slug}
                hasExistingReview={Boolean(existingReview)}
              />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium uppercase tracking-wider text-sage-dark">
              All reviews
            </h3>
            <div className="mt-4">
              <ReviewList reviews={product.reviews} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
