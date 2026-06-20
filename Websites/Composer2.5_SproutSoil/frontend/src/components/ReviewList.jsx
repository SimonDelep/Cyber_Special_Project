import { avatarSrc } from "../api/client";
import StarRating from "./StarRating";

export default function ReviewList({ reviews }) {
  if (reviews.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-soil-200 bg-soil-50 px-6 py-10 text-center text-soil-500">
        No reviews yet. Be the first to share your experience!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <article
          key={review.id}
          className="rounded-2xl border border-soil-200 bg-white p-5"
        >
          <div className="flex items-start gap-3">
            {avatarSrc(review.user_avatar) ? (
              <img
                src={avatarSrc(review.user_avatar)}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sprout-500 text-sm font-bold text-white">
                {review.username.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-soil-900">{review.username}</span>
                <StarRating value={review.rating} readonly size="sm" />
                <span className="text-xs text-soil-400">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              {review.title && (
                <h4 className="mt-1 font-display font-bold text-soil-900">
                  {review.title}
                </h4>
              )}
              <p className="mt-2 text-sm text-soil-600 leading-relaxed whitespace-pre-wrap">
                {review.content}
              </p>
              {review.image_url && (
                <img
                  src={review.image_url}
                  alt="Review"
                  className="mt-3 max-h-48 rounded-xl object-cover"
                />
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
