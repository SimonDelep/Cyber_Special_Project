import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <Link
        href="/"
        className="mb-8 font-display text-2xl font-semibold text-espresso"
      >
        Roast<span className="text-sage-dark">Ritual</span>
      </Link>
      <div className="w-full max-w-md rounded-3xl border border-sage/25 bg-cream/80 p-8 shadow-lg shadow-espresso/5">
        {children}
      </div>
    </div>
  );
}
