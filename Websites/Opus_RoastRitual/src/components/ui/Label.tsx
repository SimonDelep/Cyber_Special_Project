import { type ComponentPropsWithoutRef } from "react";

type LabelProps = ComponentPropsWithoutRef<"label">;

export function Label({ className = "", ...props }: LabelProps) {
  return (
    <label
      className={`block text-sm font-medium text-espresso ${className}`}
      {...props}
    />
  );
}
