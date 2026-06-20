import type { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({
  label,
  error,
  id,
  options,
  className = "",
  ...props
}: SelectProps) {
  const selectId = id ?? props.name;

  return (
    <div className="space-y-1.5">
      <label htmlFor={selectId} className="block text-sm font-medium text-zinc-300">
        {label}
      </label>
      <select
        id={selectId}
        className={`w-full rounded-lg border bg-zinc-900/80 px-4 py-2.5 text-sm text-zinc-100 transition focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${
          error
            ? "border-red-500/60"
            : "border-zinc-700 focus:border-cyan-500"
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
