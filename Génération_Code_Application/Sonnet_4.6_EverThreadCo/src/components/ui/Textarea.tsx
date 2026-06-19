import type { ComponentPropsWithoutRef } from "react";

type TextareaProps = ComponentPropsWithoutRef<"textarea"> & {
  label: string;
  error?: string;
};

export function Textarea({
  label,
  error,
  id,
  className = "",
  ...props
}: TextareaProps) {
  const inputId = id ?? props.name;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-sand-800">
        {label}
      </label>
      <textarea
        id={inputId}
        className={`min-h-[100px] resize-y rounded-xl border border-sand-300 bg-cream-50 px-4 py-2.5 text-sm text-sand-900 placeholder:text-sand-400 focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-200 ${className}`}
        {...props}
      />
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
