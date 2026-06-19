import { requireAdmin } from "@/lib/auth/rbac";
import { AdminNav } from "@/components/admin/AdminNav";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-sage-500">
            Administrator
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-sage-900">Admin panel</h1>
        </div>
        <Link
          href="/profile"
          className="text-sm font-medium text-sage-700 hover:text-sage-900"
        >
          ← Back to profile
        </Link>
      </div>

      <div className="mt-8">
        <AdminNav />
      </div>

      <div className="mt-8">{children}</div>
    </div>
  );
}
