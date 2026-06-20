import { createSignal, createEffect, Show, For } from 'solid-js';
import type { PublicUser } from '@/types/auth';
import type { PublicReview } from '@/types/review';
import StarRating from './StarRating';

type Props = {
  productSlug: string;
  user: PublicUser | null;
};

const inputClass =
  'mt-1 w-full rounded-lg border border-cork-300 bg-white px-3 py-2 text-sm text-cork-900 focus:border-cork-600 focus:outline-none focus:ring-1 focus:ring-cork-600';

export default function ProductReviews(props: Props) {
  const [reviews, setReviews] = createSignal<PublicReview[]>([]);
  const [ownReview, setOwnReview] = createSignal<PublicReview | null>(null);
  const [rating, setRating] = createSignal(5);
  const [title, setTitle] = createSignal('');
  const [body, setBody] = createSignal('');
  const [imageUrl, setImageUrl] = createSignal('');
  const [imageFile, setImageFile] = createSignal<File | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [saving, setSaving] = createSignal(false);
  const [error, setError] = createSignal('');
  const [message, setMessage] = createSignal('');

  async function loadReviews() {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${props.productSlug}/reviews`, {
        credentials: 'same-origin',
      });
      const data = await res.json();
      if (res.ok) {
        setReviews(data.reviews);
        setOwnReview(data.ownReview);
        if (data.ownReview) {
          setRating(data.ownReview.rating);
          setTitle(data.ownReview.title ?? '');
          setBody(data.ownReview.body);
          setImageUrl(data.ownReview.imageUrl ?? '');
        }
      }
    } finally {
      setLoading(false);
    }
  }

  createEffect(() => {
    loadReviews();
  });

  async function handleSubmit(e: Event) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!props.user) {
      window.location.href = `/login?next=/products/${props.productSlug}`;
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/products/${props.productSlug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          rating: rating(),
          title: title(),
          body: body(),
          imageUrl: imageUrl(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? Object.values(data.errors ?? {})[0] ?? 'Could not save review.');
        return;
      }

      let review = data.review as PublicReview;

      const file = imageFile();
      if (file && review?.id) {
        const formData = new FormData();
        formData.append('image', file);
        const uploadRes = await fetch(`/api/reviews/${review.id}/image`, {
          method: 'POST',
          credentials: 'same-origin',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          setError(uploadData.error ?? 'Review saved but image upload failed.');
        } else {
          review = uploadData.review;
        }
      }

      setMessage(ownReview() ? 'Review updated.' : 'Review published. Thank you!');
      setImageFile(null);
      await loadReviews();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete your review?')) return;
    const res = await fetch(`/api/products/${props.productSlug}/reviews`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    if (res.ok) {
      setRating(5);
      setTitle('');
      setBody('');
      setImageUrl('');
      setMessage('Review deleted.');
      await loadReviews();
    }
  }

  return (
    <div class="space-y-10">
      <Show when={loading()}>
        <p class="text-sm text-cork-500">Loading reviews…</p>
      </Show>

      <Show when={!loading()}>
        <section class="rounded-2xl border border-cork-200 bg-cork-50/50 p-6">
          <h3 class="font-serif text-xl text-cork-900">
            {ownReview() ? 'Edit your review' : 'Write a review'}
          </h3>
          <Show when={!props.user}>
            <p class="mt-2 text-sm text-cork-600">
              <a
                href={`/login?next=/products/${props.productSlug}`}
                class="font-medium text-cork-800 underline"
              >
                Sign in
              </a>{' '}
              to share your experience.
            </p>
          </Show>
          <Show when={props.user}>
            <Show when={message()}>
              <p class="mt-3 text-sm text-sage-700">{message()}</p>
            </Show>
            <Show when={error()}>
              <p class="mt-3 text-sm text-red-800" role="alert">
                {error()}
              </p>
            </Show>
            <form class="mt-4 space-y-4" onSubmit={handleSubmit}>
              <div>
                <span class="text-xs font-medium text-cork-700">Rating</span>
                <div class="mt-1 flex gap-1">
                  <For each={[1, 2, 3, 4, 5]}>
                    {(n) => (
                      <button
                        type="button"
                        class="text-2xl text-amber-600 hover:scale-110"
                        onClick={() => setRating(n)}
                        aria-label={`${n} stars`}
                      >
                        {n <= rating() ? '★' : '☆'}
                      </button>
                    )}
                  </For>
                </div>
              </div>
              <div>
                <label for="review-title" class="text-xs font-medium text-cork-700">
                  Title (optional)
                </label>
                <input
                  id="review-title"
                  class={inputClass}
                  value={title()}
                  onInput={(e) => setTitle(e.currentTarget.value)}
                />
              </div>
              <div>
                <label for="review-body" class="text-xs font-medium text-cork-700">
                  Your review
                </label>
                <textarea
                  id="review-body"
                  required
                  rows={4}
                  class={inputClass}
                  value={body()}
                  onInput={(e) => setBody(e.currentTarget.value)}
                />
              </div>
              <div>
                <label for="review-image-url" class="text-xs font-medium text-cork-700">
                  Photo URL (optional)
                </label>
                <input
                  id="review-image-url"
                  type="url"
                  placeholder="https://…"
                  class={inputClass}
                  value={imageUrl()}
                  onInput={(e) => setImageUrl(e.currentTarget.value)}
                />
              </div>
              <div>
                <label class="text-xs font-medium text-cork-700">Or upload a photo</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  class="mt-1 block w-full text-sm text-cork-700"
                  onChange={(e) => setImageFile(e.currentTarget.files?.[0] ?? null)}
                />
              </div>
              <div class="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving()}
                  class="rounded-full bg-cork-800 px-5 py-2 text-sm font-medium text-cork-50 hover:bg-cork-700 disabled:opacity-60"
                >
                  {saving() ? 'Saving…' : ownReview() ? 'Update review' : 'Submit review'}
                </button>
                <Show when={ownReview()}>
                  <button
                    type="button"
                    onClick={handleDelete}
                    class="rounded-full border border-red-300 px-5 py-2 text-sm text-red-800 hover:bg-red-50"
                  >
                    Delete review
                  </button>
                </Show>
              </div>
            </form>
          </Show>
        </section>

        <section>
          <h3 class="font-serif text-xl text-cork-900">
            Customer reviews ({reviews().length})
          </h3>
          <Show
            when={reviews().length > 0}
            fallback={<p class="mt-4 text-sm text-cork-500">No reviews yet. Be the first!</p>}
          >
            <ul class="mt-6 space-y-6">
              <For each={reviews()}>
                {(review) => (
                  <li class="rounded-2xl border border-cork-200 bg-white p-5">
                    <div class="flex items-start gap-3">
                      {review.avatarUrl ? (
                        <img
                          src={review.avatarUrl}
                          alt=""
                          class="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <span class="flex h-10 w-10 items-center justify-center rounded-full bg-cork-200 text-sm font-semibold text-cork-700">
                          {review.username.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <div class="flex-1">
                        <div class="flex flex-wrap items-center gap-2">
                          <span class="font-medium text-cork-900">
                            {review.displayName ?? review.username}
                          </span>
                          <StarRating value={review.rating} size="sm" />
                          <span class="text-xs text-cork-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {review.title && (
                          <p class="mt-1 font-medium text-cork-800">{review.title}</p>
                        )}
                        <p class="mt-2 text-sm leading-relaxed text-cork-600">{review.body}</p>
                        {review.imageUrl && (
                          <img
                            src={review.imageUrl}
                            alt=""
                            class="mt-3 max-h-64 rounded-xl border border-cork-200 object-cover"
                            loading="lazy"
                          />
                        )}
                      </div>
                    </div>
                  </li>
                )}
              </For>
            </ul>
          </Show>
        </section>
      </Show>
    </div>
  );
}
