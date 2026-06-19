interface StarRatingProps {
  rating: number;
  max?: number;
  size?: "sm" | "md";
}

export function StarRating({ rating, max = 5, size = "md" }: StarRatingProps) {
  const sizeClass = size === "sm" ? "text-sm" : "text-lg";

  return (
    <span
      className={`inline-flex gap-0.5 text-amber-400 ${sizeClass}`}
      aria-label={`${rating} out of ${max} stars`}
    >
      {Array.from({ length: max }, (_, i) => {
        const filled = i < Math.round(rating);
        return (
          <span key={i} aria-hidden>
            {filled ? "★" : "☆"}
          </span>
        );
      })}
    </span>
  );
}
