import { For, Show } from "solid-js";
import type { ReviewWithAuthor } from "@/db/reviews";

type Props = {
  reviews: ReviewWithAuthor[];
};

function Stars(props: { rating: number }) {
  return (
    <span class="text-accent" aria-label={`${props.rating} out of 5 stars`}>
      {"★".repeat(props.rating)}
      <span class="text-brand-200">{"★".repeat(5 - props.rating)}</span>
    </span>
  );
}

export default function ReviewList(props: Props) {
  return (
    <Show
      when={props.reviews.length > 0}
      fallback={
        <p class="rounded-xl border border-dashed border-brand-200 bg-brand-50/50 px-4 py-8 text-center text-sm text-muted">
          No reviews yet. Be the first to share your experience.
        </p>
      }
    >
      <ul class="space-y-4">
        <For each={props.reviews}>
          {(review) => (
            <li class="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p class="font-semibold text-ink">{review.authorDisplayName}</p>
                  <p class="text-xs text-muted">@{review.authorUsername}</p>
                </div>
                <div class="text-right">
                  <Stars rating={review.rating} />
                  <p class="mt-1 text-xs text-muted">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p class="mt-3 text-sm leading-relaxed text-ink">{review.comment}</p>
              <Show when={review.imageUrl}>
                <img
                  src={review.imageUrl!}
                  alt="Review"
                  class="mt-4 max-h-64 rounded-xl border border-brand-100 object-cover"
                  loading="lazy"
                />
              </Show>
            </li>
          )}
        </For>
      </ul>
    </Show>
  );
}
