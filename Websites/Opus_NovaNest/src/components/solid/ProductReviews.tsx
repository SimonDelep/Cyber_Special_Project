import { createSignal, For, onMount, Show } from 'solid-js';

interface Review {
  id: number;
  rating: number;
  body: string;
  imageUrl: string | null;
  createdAt: string;
  authorDisplayName: string;
  authorUsername: string;
  authorAvatarUrl: string | null;
}

interface Summary {
  count: number;
  averageRating: number;
}

interface User {
  id: number;
  displayName: string;
}

interface Props {
  productSlug: string;
  user: User | null;
}

function stars(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

export default function ProductReviews(props: Props) {
  const [reviews, setReviews] = createSignal<Review[]>([]);
  const [summary, setSummary] = createSignal<Summary>({ count: 0, averageRating: 0 });
  const [loading, setLoading] = createSignal(true);
  const [submitting, setSubmitting] = createSignal(false);
  const [message, setMessage] = createSignal<{ type: 'ok' | 'err'; text: string } | null>(
    null,
  );

  const [rating, setRating] = createSignal(5);
  const [body, setBody] = createSignal('');
  const [imageUrl, setImageUrl] = createSignal('');

  async function loadReviews() {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${props.productSlug}/reviews`);
      const json = await res.json();
      if (res.ok) {
        setReviews(json.reviews);
        setSummary(json.summary);
      }
    } finally {
      setLoading(false);
    }
  }

  onMount(() => loadReviews());

  async function submitReview(e: Event) {
    e.preventDefault();
    if (!props.user) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const fileInput = document.getElementById('review-image-file') as HTMLInputElement;
    const file = fileInput?.files?.[0];

    try {
      let res: Response;

      if (file) {
        const formData = new FormData();
        formData.set('rating', String(rating()));
        formData.set('body', body());
        const url = imageUrl().trim();
        if (url) formData.set('imageUrl', url);
        formData.set('image', file);
        res = await fetch(`/api/products/${props.productSlug}/reviews`, {
          method: 'POST',
          body: formData,
        });
      } else {
        res = await fetch(`/api/products/${props.productSlug}/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rating: rating(),
            body: body(),
            imageUrl: imageUrl().trim() || null,
          }),
        });
      }

      const json = await res.json();
      if (!res.ok) {
        setMessage({ type: 'err', text: json.error ?? 'Failed to submit review.' });
        return;
      }

      setMessage({ type: 'ok', text: 'Review saved successfully.' });
      setBody('');
      setImageUrl('');
      if (fileInput) fileInput.value = '';
      await loadReviews();
    } catch {
      setMessage({ type: 'err', text: 'Network error.' });
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-white/10 bg-nest-900 px-3 py-2 text-sm text-white placeholder:text-nest-100/40 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30';

  return (
    <section class="space-y-8" id="reviews">
      <div>
        <h2 class="font-display text-2xl font-semibold text-white">Customer reviews</h2>
        <Show when={!loading() && summary().count > 0}>
          <p class="mt-1 text-nest-100/60">
            {summary().averageRating} / 5 · {summary().count} review
            {summary().count === 1 ? '' : 's'}
          </p>
        </Show>
      </div>

      <Show when={props.user}>
        <form
          onSubmit={submitReview}
          class="space-y-4 rounded-2xl border border-white/10 bg-nest-900/50 p-6"
        >
          <h3 class="font-display text-lg font-semibold text-white">Write a review</h3>

          <Show when={message()}>
            <div
              class:list={[
                'rounded-lg border px-4 py-3 text-sm',
                message()!.type === 'ok'
                  ? 'border-accent/30 bg-accent/10 text-accent'
                  : 'border-red-500/30 bg-red-500/10 text-red-300',
              ]}
            >
              {message()!.text}
            </div>
          </Show>

          <label class="block space-y-1">
            <span class="text-sm text-nest-100/70">Rating</span>
            <select
              class={inputClass}
              value={String(rating())}
              onChange={(e) => setRating(Number.parseInt(e.currentTarget.value, 10))}
            >
              <option value="5">5 — Excellent</option>
              <option value="4">4 — Good</option>
              <option value="3">3 — Average</option>
              <option value="2">2 — Fair</option>
              <option value="1">1 — Poor</option>
            </select>
          </label>

          <label class="block space-y-1">
            <span class="text-sm text-nest-100/70">Your review</span>
            <textarea
              class={`${inputClass} min-h-[120px] resize-y`}
              required
              minLength={10}
              value={body()}
              onInput={(e) => setBody(e.currentTarget.value)}
              placeholder="Share your experience with this product…"
            />
          </label>

          <label class="block space-y-1">
            <span class="text-sm text-nest-100/70">Photo URL (optional)</span>
            <input
              type="url"
              class={inputClass}
              placeholder="https://…"
              value={imageUrl()}
              onInput={(e) => setImageUrl(e.currentTarget.value)}
            />
          </label>

          <label class="block space-y-1">
            <span class="text-sm text-nest-100/70">Or upload a photo (optional)</span>
            <input
              id="review-image-file"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              class="block w-full text-sm text-nest-100/70 file:mr-4 file:rounded-lg file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-medium file:text-nest-950"
            />
          </label>

          <button
            type="submit"
            disabled={submitting()}
            class="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-nest-950 hover:bg-accent/90 disabled:opacity-50"
          >
            {submitting() ? 'Submitting…' : 'Submit review'}
          </button>
        </form>
      </Show>

      <Show when={!props.user}>
        <p class="rounded-xl border border-white/10 bg-nest-900/40 px-4 py-3 text-sm text-nest-100/70">
          <a
            href={`/login?redirect=${encodeURIComponent(`/products/${props.productSlug}`)}`}
            class="font-medium text-accent hover:underline"
          >
            Sign in
          </a>{' '}
          to write a review.
        </p>
      </Show>

      <Show when={loading()} fallback={null}>
        <p class="text-nest-100/60">Loading reviews…</p>
      </Show>

      <Show when={!loading()}>
        <Show
          when={reviews().length > 0}
          fallback={<p class="text-nest-100/60">No reviews yet. Be the first!</p>}
        >
          <ul class="space-y-6">
            <For each={reviews()}>
              {(review) => (
                <li class="rounded-2xl border border-white/10 bg-nest-900/40 p-5">
                  <div class="flex items-start gap-3">
                    <Show
                      when={review.authorAvatarUrl}
                      fallback={
                        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-nest-800 text-sm text-accent">
                          {review.authorDisplayName.charAt(0).toUpperCase()}
                        </span>
                      }
                    >
                      <img
                        src={review.authorAvatarUrl!}
                        alt=""
                        class="h-10 w-10 shrink-0 rounded-full object-cover"
                        width="40"
                        height="40"
                      />
                    </Show>
                    <div class="min-w-0 flex-1">
                      <p class="font-medium text-white">{review.authorDisplayName}</p>
                      <p class="text-xs text-nest-100/50">
                        @{review.authorUsername} ·{' '}
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                      <p class="mt-1 text-sm text-glow" aria-label={`${review.rating} out of 5 stars`}>
                        {stars(review.rating)}
                      </p>
                      <p class="mt-3 whitespace-pre-wrap text-sm text-nest-100/80">
                        {review.body}
                      </p>
                      <Show when={review.imageUrl}>
                        <img
                          src={review.imageUrl!}
                          alt="Review attachment"
                          class="mt-4 max-h-64 rounded-lg border border-white/10 object-cover"
                          loading="lazy"
                        />
                      </Show>
                    </div>
                  </div>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </Show>
    </section>
  );
}
