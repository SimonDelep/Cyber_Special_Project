import { createSignal, Show } from "solid-js";
import type { Product } from "@/db/schema";
import type { ReviewWithAuthor } from "@/db/reviews";
import type { PublicUser } from "@/lib/auth/types";
import { formatPrice } from "@/lib/format";
import { addToCart } from "@/stores/cart";
import ReviewList from "@/components/reviews/ReviewList";
import ReviewForm from "@/components/reviews/ReviewForm";

type Props = {
  product: Product;
  reviews: ReviewWithAuthor[];
  stats: { average: number; count: number };
  user: PublicUser | null;
  userHasReviewed: boolean;
};

export default function ProductDetail(props: Props) {
  const [reviews, setReviews] = createSignal(props.reviews);
  const [stats, setStats] = createSignal(props.stats);
  const [hasReviewed, setHasReviewed] = createSignal(props.userHasReviewed);

  async function refreshReviews() {
    const res = await fetch(`/api/products/${props.product.slug}/reviews`);
    const json = await res.json();
    if (res.ok) {
      setReviews(json.reviews ?? []);
      setStats(json.stats ?? props.stats);
      setHasReviewed(true);
    }
  }

  return (
    <div>
      <a href="/catalog" class="text-sm font-medium text-brand-700 hover:underline">
        ← Back to catalog
      </a>

      <div class="mt-6 grid gap-10 lg:grid-cols-2">
        <div class="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-8">
          <img
            src={props.product.imageUrl}
            alt={props.product.name}
            class="mx-auto max-h-96 w-full object-contain"
            width={480}
            height={480}
          />
        </div>

        <div>
          <h1 class="font-display text-3xl font-semibold text-ink">
            {props.product.name}
          </h1>
          <div class="mt-2 flex flex-wrap items-center gap-3">
            <span class="text-2xl font-semibold text-brand-800">
              {formatPrice(props.product.priceCents)}
            </span>
            <Show when={stats().count > 0}>
              <span class="text-sm text-muted">
                ★ {stats().average} ({stats().count} review
                {stats().count === 1 ? "" : "s"})
              </span>
            </Show>
          </div>
          <div class="mt-3 flex flex-wrap gap-2">
            <span class="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium capitalize text-brand-800">
              {props.product.category.replace("-", " ")}
            </span>
            {props.product.stackable && (
              <span class="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs text-muted">
                Stackable
              </span>
            )}
            {props.product.leakProof && (
              <span class="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs text-muted">
                Leak-proof
              </span>
            )}
            {props.product.capacityMl && (
              <span class="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs text-muted">
                {props.product.capacityMl} ml
              </span>
            )}
          </div>
          <p class="mt-6 leading-relaxed text-muted">{props.product.description}</p>
          <button
            type="button"
            onClick={() =>
              addToCart({
                productId: props.product.id,
                slug: props.product.slug,
                name: props.product.name,
                priceCents: props.product.priceCents,
              })
            }
            class="mt-8 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Add to cart
          </button>
        </div>
      </div>

      <section class="mt-16">
        <h2 class="font-display text-2xl font-semibold text-ink">Customer reviews</h2>
        <p class="mt-1 text-sm text-muted">
          {stats().count} review{stats().count === 1 ? "" : "s"}
          {stats().count > 0 ? ` · average ${stats().average} / 5` : ""}
        </p>

        <div class="mt-8 space-y-8">
          <Show
            when={props.user}
            fallback={
              <p class="rounded-xl border border-brand-200 bg-brand-50/80 px-4 py-3 text-sm text-muted">
                <a href={`/login?next=${encodeURIComponent(`/products/${props.product.slug}`)}`} class="font-semibold text-brand-700 hover:underline">
                  Sign in
                </a>{" "}
                to leave a review with optional photo.
              </p>
            }
          >
            <Show
              when={!hasReviewed()}
              fallback={
                <p class="rounded-xl border border-brand-100 bg-white px-4 py-3 text-sm text-muted">
                  You have already reviewed this product.
                </p>
              }
            >
              <ReviewForm
                productSlug={props.product.slug}
                onSubmitted={refreshReviews}
              />
            </Show>
          </Show>

          <ReviewList reviews={reviews()} />
        </div>
      </section>
    </div>
  );
}
