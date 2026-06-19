import { type ComponentPropsWithoutRef } from "react";

type InputProps = ComponentPropsWithoutRef<"input">;

export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`w-full rounded-xl border border-sage/30 bg-cream px-4 py-3 text-sm text-espresso placeholder:text-espresso/40 focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20 ${className}`}
      {...props}
    />
  );
}
