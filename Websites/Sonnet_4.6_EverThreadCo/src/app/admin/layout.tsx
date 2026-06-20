import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/auth/session";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-sage-700">
        Administrator
      </p>
      <h1 className="mt-2 font-display text-3xl text-sand-900 md:text-4xl">
        Admin panel
      </h1>
      <div className="mt-8">
        <AdminNav />
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}
