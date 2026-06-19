import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../api/client";
import { createProductReview, fetchProductReviews, uploadReviewImage } from "../api/reviews";
import { useAuth } from "../context/AuthContext";
import type { Review } from "../types/review";

type ImageMode = "none" | "url" | "upload";

function displayName(review: Review) {
  return review.author.first_name || review.author.username;
}

function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1" role="group" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-2xl transition ${
            star <= value ? "text-amber-500" : "text-aura-300 hover:text-amber-400"
          }`}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function ReviewListItem({ review }: { review: Review }) {
  return (
    <article className="rounded-xl border border-aura-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-aura-950">{displayName(review)}</p>
          <p className="text-xs text-aura-500">
            {new Date(review.created_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex text-amber-500" aria-label={`${review.rating} out of 5 stars`}>
          {Array.from({ length: review.rating }, (_, i) => (
            <span key={i}>★</span>
          ))}
        </div>
      </div>
      {review.title && <h4 className="mt-3 font-medium text-aura-900">{review.title}</h4>}
      <p className="mt-2 text-sm leading-relaxed text-aura-700">{review.body}</p>
      {review.image_url && (
        <img
          src={review.image_url}
          alt="Review"
          className="mt-4 max-h-64 w-full max-w-md rounded-lg object-cover"
        />
      )}
    </article>
  );
}

export default function ReviewSection({ productId }: { productId: number }) {
  const { isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageMode, setImageMode] = useState<ImageMode>("none");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  function loadReviews() {
    setLoading(true);
    fetchProductReviews(productId)
      .then(setReviews)
      .catch(() => setError("Could not load reviews."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadReviews();
  }, [productId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (body.trim().length < 10) {
      setFormError("Review must be at least 10 characters.");
      return;
    }

    setSubmitting(true);
    try {
      let resolvedImageUrl: string | null = null;
      if (imageMode === "url" && imageUrl.trim()) {
        resolvedImageUrl = imageUrl.trim();
      } else if (imageMode === "upload" && imageFile) {
        const uploaded = await uploadReviewImage(imageFile);
        resolvedImageUrl = uploaded.image_url;
      }

      await createProductReview(productId, {
        rating,
        title: title.trim() || null,
        body: body.trim(),
        image_url: resolvedImageUrl,
      });

      setFormSuccess("Thank you! Your review has been published.");
      setTitle("");
      setBody("");
      setImageUrl("");
      setImageFile(null);
      setImageMode("none");
      setRating(5);
      loadReviews();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not submit review.";
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-16 border-t border-aura-200 pt-12">
      <h2 className="font-display text-2xl font-semibold text-aura-950">Customer reviews</h2>

      {loading && <p className="mt-6 text-sm text-aura-500">Loading reviews…</p>}
      {error && (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && reviews.length === 0 && (
        <p className="mt-6 text-sm text-aura-600">No reviews yet. Be the first to share your thoughts.</p>
      )}

      {!loading && reviews.length > 0 && (
        <div className="mt-6 space-y-4">
          {reviews.map((review) => (
            <ReviewListItem key={review.id} review={review} />
          ))}
        </div>
      )}

      <div className="mt-10 rounded-2xl border border-aura-200 bg-aura-50/50 p-6">
        <h3 className="font-display text-lg font-semibold text-aura-950">Write a review</h3>

        {!isAuthenticated ? (
          <p className="mt-3 text-sm text-aura-600">
            <Link to="/login" className="font-semibold text-aura-800 hover:text-aura-950">
              Sign in
            </Link>{" "}
            to leave a review for this product.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <span className="mb-2 block text-sm font-medium text-aura-800">Your rating</span>
              <StarRating value={rating} onChange={setRating} />
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-aura-800">Title (optional)</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                className="w-full rounded-lg border border-aura-200 bg-white px-3 py-2 text-sm outline-none ring-aura-400 focus:ring-2"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-aura-800">Review</span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                minLength={10}
                rows={4}
                placeholder="Share your experience with this item…"
                className="w-full rounded-lg border border-aura-200 bg-white px-3 py-2 text-sm outline-none ring-aura-400 focus:ring-2"
              />
            </label>

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-aura-800">Photo (optional)</legend>
              <div className="flex flex-wrap gap-4 text-sm">
                {(["none", "url", "upload"] as ImageMode[]).map((mode) => (
                  <label key={mode} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="imageMode"
                      checked={imageMode === mode}
                      onChange={() => {
                        setImageMode(mode);
                        setImageUrl("");
                        setImageFile(null);
                      }}
                    />
                    {mode === "none" && "No photo"}
                    {mode === "url" && "Image link"}
                    {mode === "upload" && "Upload file"}
                  </label>
                ))}
              </div>

              {imageMode === "url" && (
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="mt-3 w-full rounded-lg border border-aura-200 bg-white px-3 py-2 text-sm outline-none ring-aura-400 focus:ring-2"
                />
              )}

              {imageMode === "upload" && (
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                  className="mt-3 block w-full text-sm text-aura-700 file:mr-4 file:rounded-full file:border-0 file:bg-aura-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-aura-50"
                />
              )}
            </fieldset>

            {formError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {formError}
              </p>
            )}
            {formSuccess && (
              <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800" role="status">
                {formSuccess}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-aura-950 px-6 py-2.5 text-sm font-semibold text-aura-50 transition hover:bg-aura-800 disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit review"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
