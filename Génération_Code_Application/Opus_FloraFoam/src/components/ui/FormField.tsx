import type { InputHTMLAttributes, ReactNode } from "react";

type FormFieldProps = {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>;

export function FormField({ label, name, error, hint, children, className = "", ...props }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-medium text-sage-800">
        {label}
      </label>
      {children ?? (
        <input
          id={name}
          name={name}
          className={`w-full rounded-lg border border-sage-300 bg-cream-50 px-3 py-2 text-sm text-sage-900 outline-none transition-colors placeholder:text-sage-400 focus:border-sage-500 focus:ring-2 focus:ring-sage-200 ${className}`}
          {...props}
        />
      )}
      {hint && !error && <p className="text-xs text-sage-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function FormMessage({ type, message }: { type: "success" | "error"; message: string }) {
  const styles =
    type === "success"
      ? "border-sage-300 bg-sage-50 text-sage-800"
      : "border-red-200 bg-red-50 text-red-800";
  return (
    <p className={`rounded-lg border px-3 py-2 text-sm ${styles}`} role="alert">
      {message}
    </p>
  );
}
