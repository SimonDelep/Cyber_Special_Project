import Link from "next/link";
import type { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary";

interface ButtonProps {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-cyan-500 text-zinc-950 hover:bg-cyan-400 shadow-lg shadow-cyan-500/20",
  secondary:
    "border border-zinc-700 bg-zinc-900/50 text-zinc-100 hover:border-zinc-500 hover:bg-zinc-800",
};

export function Button({ href, children, variant = "primary" }: ButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition ${variantClasses[variant]}`}
    >
      {children}
    </Link>
  );
}
