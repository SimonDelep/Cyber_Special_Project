import Link from "next/link";
import type { ReactNode } from "react";

import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl text-espresso">Admin panel</h1>
          <p className="mt-1 text-sm text-espresso/70">
            Manage users, balances, products, and system logs.
          </p>
        </div>
        <Link
          href="/"
          className="text-sm font-medium text-sage-dark hover:underline"
        >
          ← Back to store
        </Link>
      </div>
      <div className="mt-8">
        <AdminNav />
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}
