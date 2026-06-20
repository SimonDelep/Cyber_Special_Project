import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export function Select({ label, className = "", id, children, ...props }: SelectProps) {
  const selectId = id ?? props.name;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-espresso">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`rounded-xl border border-sage/30 bg-cream px-3 py-2 text-sm text-espresso focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
