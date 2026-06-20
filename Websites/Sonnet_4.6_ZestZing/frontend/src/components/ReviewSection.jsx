import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

function StarRating({ value, onChange, readonly = false }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`text-2xl ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"} ${
            star <= value ? "text-amber-400" : "text-stone-300"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function ReviewSection({ productId }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadReviews = () => {
    api
      .getProductReviews(productId)
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const userHasReviewed = user && reviews.some((r) => r.user_id === user.id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      let finalImageUrl = imageUrl.trim() || null;
      if (imageFile) {
        const uploaded = await api.uploadReviewImage(productId, imageFile);
        finalImageUrl = uploaded.image_url;
      }
      await api.createReview(productId, {
        rating,
        comment: comment.trim(),
        image_url: finalImageUrl,
      });
      setComment("");
      setImageUrl("");
      setImageFile(null);
      setRating(5);
      setSuccess("Thank you! Your review has been published.");
      setLoading(true);
      loadReviews();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl font-bold text-stone-900">Customer Reviews</h2>

      {loading ? (
        <p className="mt-4 text-stone-500">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="mt-4 text-stone-500">No reviews yet. Be the first!</p>
      ) : (
        <ul className="mt-6 space-y-6">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-stone-900">{review.username}</p>
                  <p className="text-xs text-stone-500">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
                <StarRating value={review.rating} readonly />
              </div>
              <p className="mt-3 text-stone-700 leading-relaxed">{review.comment}</p>
              {review.image_url && (
                <img
                  src={review.image_url}
                  alt="Review"
                  className="mt-4 max-h-64 rounded-lg border border-stone-200 object-cover"
                />
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10 rounded-2xl border border-stone-200 bg-stone-50 p-6">
        <h3 className="text-lg font-semibold text-stone-900">Write a review</h3>
        {!user ? (
          <p className="mt-3 text-sm text-stone-600">
            <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
              Sign in
            </Link>{" "}
            to share your experience.
          </p>
        ) : userHasReviewed ? (
          <p className="mt-3 text-sm text-stone-600">You have already reviewed this product.</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {success && (
              <p className="rounded-lg bg-green-50 text-green-800 text-sm px-4 py-3">{success}</p>
            )}
            {error && (
              <p className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">{error}</p>
            )}
            <div>
              <label className="block text-sm font-medium text-stone-700">Rating</label>
              <StarRating value={rating} onChange={setRating} />
            </div>
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-stone-700">
                Your review (min 10 characters)
              </label>
              <textarea
                id="comment"
                required
                minLength={10}
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                placeholder="What did you think of this product?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">
                Photo URL (optional)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setImageFile(null);
                }}
                placeholder="https://example.com/photo.jpg"
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                disabled={!!imageFile}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">
                Or upload a photo (optional)
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={(e) => {
                  setImageFile(e.target.files?.[0] || null);
                  if (e.target.files?.[0]) setImageUrl("");
                }}
                className="mt-1 text-sm text-stone-600"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit review"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
