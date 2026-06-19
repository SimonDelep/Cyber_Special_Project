import { requireAdmin } from "@/lib/auth";
import { PageShell } from "@/components/layout/PageShell";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <PageShell>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin panel</h1>
          <p className="mt-2 text-zinc-400">
            Manage users, products, and audit events.
          </p>
        </div>
        <AdminNav />
      </div>
      <div className="mt-10">{children}</div>
    </PageShell>
  );
}
