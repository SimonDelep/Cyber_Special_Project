import { useState } from "react";
import { Link } from "react-router-dom";
import { reviewApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import StarRating from "./StarRating";

export default function ReviewForm({ productId, existingReview, onSuccess }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(existingReview?.rating ?? 5);
  const [title, setTitle] = useState(existingReview?.title ?? "");
  const [content, setContent] = useState(existingReview?.content ?? "");
  const [imageUrl, setImageUrl] = useState(
    existingReview?.image_url?.startsWith("http") ? existingReview.image_url : ""
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);

  if (!user) {
    return (
      <div className="rounded-2xl border border-soil-200 bg-soil-50 p-6 text-center">
        <p className="text-soil-600">
          <Link to="/login" className="font-medium text-sprout-600 hover:underline">
            Sign in
          </Link>{" "}
          to write a review.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      let review;
      const body = {
        rating,
        title: title.trim() || null,
        content: content.trim(),
        image_url: imageUrl.trim() || null,
      };

      if (existingReview) {
        review = await reviewApi.update(existingReview.id, body);
      } else {
        review = await reviewApi.create(productId, body);
      }

      if (pendingFile) {
        review = await reviewApi.uploadImage(review.id, pendingFile);
      } else if (imageUrl.trim() && !existingReview?.image_url?.startsWith("/uploads")) {
        review = await reviewApi.setImageUrl(review.id, imageUrl.trim());
      }

      onSuccess(review);
      if (!existingReview) {
        setTitle("");
        setContent("");
        setImageUrl("");
        setPendingFile(null);
        setRating(5);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-soil-200 bg-white p-6 space-y-4">
      <h3 className="font-display text-lg font-bold text-soil-900">
        {existingReview ? "Edit your review" : "Write a review"}
      </h3>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <div>
        <label className="block text-sm font-medium text-soil-700 mb-1">Rating</label>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>

      <div>
        <label htmlFor="review-title" className="block text-sm font-medium text-soil-700">
          Title (optional)
        </label>
        <input
          id="review-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-lg border border-soil-200 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="review-content" className="block text-sm font-medium text-soil-700">
          Your review
        </label>
        <textarea
          id="review-content"
          required
          minLength={10}
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="mt-1 w-full rounded-lg border border-soil-200 px-3 py-2"
          placeholder="Share how this product worked for your indoor garden…"
        />
      </div>

      <div>
        <label htmlFor="review-image-url" className="block text-sm font-medium text-soil-700">
          Photo URL (optional)
        </label>
        <input
          id="review-image-url"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/my-garden.jpg"
          className="mt-1 w-full rounded-lg border border-soil-200 px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-soil-700">
          Or upload a photo
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
          className="mt-2 block w-full text-sm text-soil-600 file:mr-4 file:rounded-full file:border-0 file:bg-sprout-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-sprout-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sprout-600 disabled:opacity-60"
      >
        {submitting ? "Submitting…" : existingReview ? "Update review" : "Submit review"}
      </button>
    </form>
  );
}
