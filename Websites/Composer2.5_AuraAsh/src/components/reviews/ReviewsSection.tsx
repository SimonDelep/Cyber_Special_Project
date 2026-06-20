import Link from "next/link";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { StarRating } from "@/components/reviews/StarRating";
import { getAverageRating } from "@/lib/reviews";
import { formatDate } from "@/lib/utils";
import type { SafeUser } from "@/lib/auth";
import type { ReviewItem } from "@/types";

interface ReviewsSectionProps {
  productId: string;
  productSlug: string;
  reviews: ReviewItem[];
  user: SafeUser | null;
  userReview: ReviewItem | null;
}

export function ReviewsSection({
  productId,
  productSlug,
  reviews,
  user,
  userReview,
}: ReviewsSectionProps) {
  const averageRating = getAverageRating(reviews);
  const redirectPath = `/shop/${productSlug}`;

  return (
    <section className="mt-20 border-t border-stone/15 pt-16">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-3xl font-medium text-charcoal">
            Customer reviews
          </h2>
          {averageRating !== null ? (
            <div className="mt-2 flex items-center gap-3">
              <StarRating rating={averageRating} />
              <span className="text-sm text-stone">
                {averageRating} out of 5 · {reviews.length}{" "}
                {reviews.length === 1 ? "review" : "reviews"}
              </span>
            </div>
          ) : (
            <p className="mt-2 text-sm text-stone">No reviews yet.</p>
          )}
        </div>
      </div>

      {reviews.length > 0 && (
        <ul className="mt-10 space-y-6">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="rounded-2xl border border-stone/15 bg-warm-white p-6"
            >
              <div className="flex items-start gap-4">
                {review.user.profilePicture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={review.user.profilePicture}
                    alt=""
                    className="size-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex size-10 items-center justify-center rounded-full bg-cream text-sm font-semibold text-charcoal">
                    {review.user.username[0]?.toUpperCase()}
                  </span>
                )}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-medium text-charcoal">{review.user.username}</p>
                    <StarRating rating={review.rating} size="sm" />
                    <p className="text-xs text-stone">{formatDate(review.createdAt)}</p>
                  </div>
                  {review.title && (
                    <p className="mt-2 font-medium text-charcoal">{review.title}</p>
                  )}
                  <p className="mt-2 text-sm leading-relaxed text-stone">
                    {review.content}
                  </p>
                  {review.imageUrl && (
                    <div className="mt-4 overflow-hidden rounded-xl border border-stone/15">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={review.imageUrl}
                        alt="Review photo"
                        className="max-h-64 w-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10">
        {userReview ? (
          <div className="rounded-2xl border border-stone/15 bg-cream/50 p-6 text-sm text-stone">
            You have already reviewed this product. Thank you for your feedback!
          </div>
        ) : user ? (
          <ReviewForm productId={productId} user={user} />
        ) : (
          <div className="rounded-2xl border border-stone/15 bg-cream/50 p-6 text-sm text-stone">
            <Link
              href={`/login?redirect=${encodeURIComponent(redirectPath)}`}
              className="font-medium text-ember hover:underline"
            >
              Sign in
            </Link>{" "}
            to leave a review.
          </div>
        )}
      </div>
    </section>
  );
}
