import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, id, className = "", ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-zinc-300">
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full rounded-lg border bg-zinc-900/80 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 transition focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${
          error
            ? "border-red-500/60 focus:border-red-500"
            : "border-zinc-700 focus:border-cyan-500"
        } ${className}`}
        {...props}
      />
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
