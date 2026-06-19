export default function StarRating({ value, onChange, size = "md", readonly = false }) {
  const sizeClass = size === "lg" ? "text-2xl" : "text-lg";

  return (
    <div className={`flex gap-0.5 ${sizeClass}`} role={readonly ? "img" : "group"}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"} transition-transform ${
            star <= value ? "text-amber-400" : "text-soil-300"
          }`}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
