import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchProductReviews,
  submitReviewJson,
  submitReviewWithFile,
} from "../api/products";
import { useAuth } from "../context/AuthContext";
import type { Review } from "../types/review";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-500" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rating)}
      <span className="text-forest-200">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default function ReviewSection({ productId }: { productId: number }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [imageMode, setImageMode] = useState<"url" | "file">("url");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadReviews() {
    setLoading(true);
    try {
      setReviews(await fetchProductReviews(productId));
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, [productId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      if (imageMode === "file") {
        const fileInput = (e.target as HTMLFormElement).elements.namedItem(
          "reviewFile"
        ) as HTMLInputElement;
        const file = fileInput?.files?.[0];
        await submitReviewWithFile(productId, {
          rating,
          comment,
          file: file || undefined,
        });
      } else {
        await submitReviewJson(productId, {
          rating,
          comment,
          image_url: imageUrl.trim() || undefined,
        });
      }
      setComment("");
      setImageUrl("");
      setMessage("Your review was saved.");
      await loadReviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit review");
    } finally {
      setSubmitting(false);
    }
  }

  const avg =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <section className="mt-12 border-t border-forest-200/80 pt-12">
      <h2 className="font-display text-2xl font-semibold text-forest-800">Customer reviews</h2>
      {avg && (
        <p className="mt-1 text-sm text-stone-600">
          {avg} average · {reviews.length} review{reviews.length === 1 ? "" : "s"}
        </p>
      )}

      {user ? (
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-2xl border border-forest-200/80 bg-white p-5 shadow-sm"
        >
          <h3 className="font-medium text-forest-800">Write a review</h3>
          {message && (
            <p className="mt-2 text-sm text-green-800 bg-green-50 rounded-lg px-3 py-2">{message}</p>
          )}
          {error && (
            <p className="mt-2 text-sm text-red-800 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
          <label className="mt-4 block text-sm text-forest-700">
            Rating
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="mt-1 rounded-lg border border-forest-200 px-3 py-2"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} stars
                </option>
              ))}
            </select>
          </label>
          <label className="mt-4 block text-sm text-forest-700">
            Your review
            <textarea
              required
              minLength={3}
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-1 w-full rounded-lg border border-forest-200 px-3 py-2 text-sm"
              placeholder="Share your experience with this product…"
            />
          </label>
          <div className="mt-4 flex gap-2 text-sm">
            <button
              type="button"
              onClick={() => setImageMode("url")}
              className={`rounded-full px-3 py-1 ${imageMode === "url" ? "bg-forest-600 text-white" : "bg-forest-100"}`}
            >
              Image URL
            </button>
            <button
              type="button"
              onClick={() => setImageMode("file")}
              className={`rounded-full px-3 py-1 ${imageMode === "file" ? "bg-forest-600 text-white" : "bg-forest-100"}`}
            >
              Upload image
            </button>
          </div>
          {imageMode === "url" ? (
            <input
              type="url"
              placeholder="https://example.com/photo.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="mt-2 w-full rounded-lg border border-forest-200 px-3 py-2 text-sm"
            />
          ) : (
            <input
              type="file"
              name="reviewFile"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="mt-2 block w-full text-sm"
            />
          )}
          <button
            type="submit"
            disabled={submitting}
            className="mt-4 rounded-full bg-forest-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-forest-700 disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit review"}
          </button>
        </form>
      ) : (
        <p className="mt-4 text-sm text-stone-600">
          <Link to="/login" className="font-medium text-forest-600 hover:text-forest-700">
            Sign in
          </Link>{" "}
          to leave a review.
        </p>
      )}

      {loading ? (
        <p className="mt-8 text-stone-600">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="mt-8 text-stone-600">No reviews yet. Be the first!</p>
      ) : (
        <ul className="mt-8 space-y-6">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-forest-200/60 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-forest-800">@{r.username}</span>
                <Stars rating={r.rating} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-stone-700">{r.comment}</p>
              {r.image_url && (
                <img
                  src={r.image_url}
                  alt=""
                  className="mt-4 max-h-64 rounded-xl object-cover"
                />
              )}
              <p className="mt-2 text-xs text-stone-500">
                {new Date(r.created_at).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
