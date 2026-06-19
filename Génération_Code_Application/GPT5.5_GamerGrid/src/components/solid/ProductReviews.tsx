import { createSignal, Show, onMount } from 'solid-js';
import type { PublicUser } from '@/lib/auth/types';
import type { ProductDTO, ReviewDTO } from '@/lib/types';

interface Props {
  product: ProductDTO;
  user: PublicUser | null;
}

export default function ProductReviews(props: Props) {
  const [reviews, setReviews] = createSignal<ReviewDTO[]>([]);
  const [userReview, setUserReview] = createSignal<ReviewDTO | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [submitting, setSubmitting] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [success, setSuccess] = createSignal<string | null>(null);

  const [rating, setRating] = createSignal(5);
  const [title, setTitle] = createSignal('');
  const [body, setBody] = createSignal('');
  const [imageUrl, setImageUrl] = createSignal('');
  const [imageFile, setImageFile] = createSignal<File | null>(null);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${props.product.id}/reviews`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load reviews.');

      const parseReview = (r: ReviewDTO): ReviewDTO => ({
        ...r,
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt),
      });

      setReviews((data.reviews ?? []).map(parseReview));
      setUserReview(data.userReview ? parseReview(data.userReview) : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  };

  onMount(() => loadReviews());

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    if (!props.user) return;

    setError(null);
    setSuccess(null);
    setSubmitting(true);

    const formData = new FormData();
    formData.append('rating', String(rating()));
    formData.append('title', title());
    formData.append('body', body());
    if (imageUrl().trim()) formData.append('imageUrl', imageUrl().trim());
    if (imageFile()) formData.append('image', imageFile()!);

    try {
      const res = await fetch(`/api/products/${props.product.id}/reviews`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to submit review.');

      setSuccess('Thank you! Your review has been published.');
      setTitle('');
      setBody('');
      setImageUrl('');
      setImageFile(null);
      await loadReviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const review = userReview();
    if (!review || !confirm('Delete your review?')) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/reviews/${review.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Delete failed.');
      setSuccess('Review deleted.');
      await loadReviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = () => {
    const list = reviews();
    if (list.length === 0) return 0;
    return list.reduce((s, r) => s + r.rating, 0) / list.length;
  };

  return (
    <div id="reviews" class="space-y-8 scroll-mt-24">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-2xl font-bold text-white">Customer reviews</h2>
          <p class="mt-1 text-slate-400">
            {reviews().length === 0
              ? 'No reviews yet. Be the first!'
              : `${reviews().length} review${reviews().length === 1 ? '' : 's'} · ${averageRating().toFixed(1)} ★ average`}
          </p>
        </div>
      </div>

      <Show when={error()}>
        <p class="rounded-lg border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200" role="alert">
          {error()}
        </p>
      </Show>
      <Show when={success()}>
        <p class="rounded-lg border border-stream-500/30 bg-stream-500/10 px-4 py-3 text-sm text-stream-300" role="status">
          {success()}
        </p>
      </Show>

      <Show when={!props.user}>
        <p class="rounded-lg border border-amber-500/30 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
          <a href={`/login?redirect=/products/${props.product.slug}#reviews`} class="font-medium underline">
            Sign in
          </a>{' '}
          to write a review with optional photo (URL or file upload).
        </p>
      </Show>

      <Show when={props.user && !userReview()}>
        <form
          onSubmit={handleSubmit}
          class="rounded-2xl border border-volt-500/20 bg-slate-900/60 p-6 space-y-4"
        >
          <h3 class="text-lg font-semibold text-white">Write a review</h3>

          <div>
            <label class="mb-1.5 block text-xs text-slate-400">Rating</label>
            <select
              value={String(rating())}
              onChange={(e) => setRating(Number(e.currentTarget.value))}
              class="rounded-lg border border-white/10 bg-slate-950 px-4 py-2 text-white"
            >
              <option value="5">5 — Excellent</option>
              <option value="4">4 — Good</option>
              <option value="3">3 — Average</option>
              <option value="2">2 — Fair</option>
              <option value="1">1 — Poor</option>
            </select>
          </div>

          <div>
            <label class="mb-1.5 block text-xs text-slate-400">Title</label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={100}
              value={title()}
              onInput={(e) => setTitle(e.currentTarget.value)}
              class="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-2 text-white"
              placeholder="Summarize your experience"
            />
          </div>

          <div>
            <label class="mb-1.5 block text-xs text-slate-400">Review</label>
            <textarea
              required
              minLength={10}
              maxLength={2000}
              rows={4}
              value={body()}
              onInput={(e) => setBody(e.currentTarget.value)}
              class="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-2 text-white"
              placeholder="Share details about quality, noise level, ease of use…"
            />
          </div>

          <div>
            <label class="mb-1.5 block text-xs text-slate-400">Photo URL (optional)</label>
            <input
              type="url"
              value={imageUrl()}
              onInput={(e) => setImageUrl(e.currentTarget.value)}
              placeholder="https://example.com/photo.jpg"
              class="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-2 text-white"
            />
          </div>

          <div>
            <label class="mb-1.5 block text-xs text-slate-400">Or upload a photo (optional)</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => setImageFile(e.currentTarget.files?.[0] ?? null)}
              class="block w-full text-sm text-slate-400 file:mr-4 file:rounded-full file:border-0 file:bg-volt-600 file:px-4 file:py-2 file:text-sm file:text-white"
            />
            <p class="mt-1 text-xs text-slate-500">File upload overrides URL if both are provided. Max 2 MB.</p>
          </div>

          <button
            type="submit"
            disabled={submitting()}
            class="rounded-full bg-volt-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-volt-500 disabled:opacity-60"
          >
            {submitting() ? 'Submitting…' : 'Submit review'}
          </button>
        </form>
      </Show>

      <Show when={props.user && userReview()}>
        <div class="rounded-2xl border border-volt-500/30 bg-volt-950/30 p-4 text-sm text-volt-200">
          You already reviewed this product.
          <button
            type="button"
            onClick={handleDelete}
            disabled={submitting()}
            class="ml-2 text-red-400 hover:text-red-300 underline"
          >
            Delete your review
          </button>
        </div>
      </Show>

      <Show when={loading()}>
        <p class="text-slate-400">Loading reviews…</p>
      </Show>

      <div class="space-y-4">
        {reviews().map((review) => (
          <article class="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p class="font-medium text-white">{review.authorName}</p>
                <p class="text-xs text-slate-500">@{review.authorUsername}</p>
              </div>
              <div class="flex items-center gap-1" aria-label={`${review.rating} out of 5 stars`}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span class={star <= review.rating ? 'text-amber-400' : 'text-slate-600'}>
                    ★
                  </span>
                ))}
              </div>
            </div>
            <h4 class="mt-3 font-semibold text-slate-100">{review.title}</h4>
            <p class="mt-2 text-sm leading-relaxed text-slate-400">{review.body}</p>
            {review.image && (
              <img
                src={review.image}
                alt="Review attachment"
                class="mt-4 max-h-64 rounded-lg border border-white/10 object-cover"
                loading="lazy"
              />
            )}
            <p class="mt-3 text-xs text-slate-500">
              {review.createdAt.toLocaleDateString()}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
