import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { queryDb } from "@/lib/db-query";
import { prisma } from "@/lib/prisma";
import { Alert } from "@/components/ui/Alert";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const countsResult = await queryDb(() =>
    Promise.all([prisma.user.count(), prisma.product.count()])
  );

  if (countsResult.dbError || !countsResult.data) {
    return <Alert>{countsResult.dbError ?? "Unable to load admin dashboard."}</Alert>;
  }

  const [userCount, productCount] = countsResult.data;

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Link
        href="/admin/users"
        className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 transition hover:border-cyan-500/50 hover:bg-zinc-900/70"
      >
        <h2 className="text-lg font-semibold text-zinc-50">Users</h2>
        <p className="mt-2 text-3xl font-bold text-cyan-400">{userCount}</p>
        <p className="mt-2 text-sm text-zinc-500">
          View accounts, edit roles and balances
        </p>
      </Link>
      <Link
        href="/admin/products"
        className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 transition hover:border-cyan-500/50 hover:bg-zinc-900/70"
      >
        <h2 className="text-lg font-semibold text-zinc-50">Products</h2>
        <p className="mt-2 text-3xl font-bold text-cyan-400">{productCount}</p>
        <p className="mt-2 text-sm text-zinc-500">
          Create, edit, and delete shop inventory
        </p>
      </Link>
      <Link
        href="/admin/audit"
        className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 transition hover:border-cyan-500/50 hover:bg-zinc-900/70"
      >
        <h2 className="text-lg font-semibold text-zinc-50">Audit log</h2>
        <p className="mt-2 text-sm text-zinc-500">
          View sign-ins, orders, cart changes, and admin actions
        </p>
      </Link>
      <div className="sm:col-span-2 flex flex-wrap gap-3">
        <Link
          href="/admin/products/new"
          className="rounded-full bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-400"
        >
          + Add product
        </Link>
        <Link
          href="/admin/products"
          className="rounded-full border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-500"
        >
          Manage products
        </Link>
      </div>
    </div>
  );
}
