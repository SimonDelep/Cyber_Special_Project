type StarRatingProps = {
  rating: number;
  max?: number;
  size?: "sm" | "md";
};

export function StarRating({ rating, max = 5, size = "sm" }: StarRatingProps) {
  const textSize = size === "md" ? "text-lg" : "text-sm";

  return (
    <span
      className={`inline-flex gap-0.5 text-amber-600 ${textSize}`}
      aria-label={`${rating} out of ${max} stars`}
    >
      {Array.from({ length: max }, (_, i) => (
        <span key={i}>{i < Math.round(rating) ? "★" : "☆"}</span>
      ))}
    </span>
  );
}
