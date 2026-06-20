import type { ReactNode } from "react";

type AuthCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="mx-auto w-full max-w-md px-6 py-16">
      <div className="rounded-2xl border border-sand-200 bg-cream-50 p-8 shadow-sm">
        <h1 className="font-display text-3xl text-sand-900">{title}</h1>
        {subtitle ? (
          <p className="mt-2 text-sm text-sand-600">{subtitle}</p>
        ) : null}
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
