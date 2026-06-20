import { cn } from "@/lib/utils";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className, id, ...props }: SelectProps) {
  const selectId = id ?? props.name;

  return (
    <div className="space-y-1.5">
      <label htmlFor={selectId} className="block text-sm font-medium text-charcoal">
        {label}
      </label>
      <select
        id={selectId}
        className={cn(
          "w-full rounded-xl border border-stone/25 bg-warm-white px-4 py-2.5 text-sm",
          "outline-none transition-colors focus:border-ember focus:ring-1 focus:ring-ember/30",
          error && "border-red-400 focus:border-red-400 focus:ring-red-400/30",
          className,
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
