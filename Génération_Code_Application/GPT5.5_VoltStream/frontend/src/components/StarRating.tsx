interface Props {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md";
}

export default function StarRating({ value, onChange, size = "md" }: Props) {
  const starClass = size === "sm" ? "text-base" : "text-2xl";

  return (
    <div className="flex gap-1" role={onChange ? "group" : undefined} aria-label={`Rating: ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(star)}
          className={`${starClass} transition-colors ${
            onChange ? "cursor-pointer hover:scale-110" : "cursor-default"
          } ${star <= value ? "text-amber-400" : "text-grid-border"}`}
          aria-label={onChange ? `Rate ${star} stars` : undefined}
        >
          ★
        </button>
      ))}
    </div>
  );
}
