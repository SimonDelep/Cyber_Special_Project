import Link from "next/link";
import type { ReactNode } from "react";

type AuthCardProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="rounded-2xl border border-sage-200/80 bg-cream-50 p-8 shadow-sm">
        <h1 className="font-display text-3xl font-semibold text-sage-900">{title}</h1>
        <p className="mt-2 text-sm text-sage-600">{subtitle}</p>
        <div className="mt-8">{children}</div>
        <p className="mt-6 text-center text-sm text-sage-600">{footer}</p>
      </div>
      <p className="mt-6 text-center text-sm text-sage-500">
        <Link href="/" className="font-medium text-sage-700 hover:text-sage-900">
          ← Back to FloraFoam
        </Link>
      </p>
    </div>
  );
}
