import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Admin Dashboard | FloraFoam",
};

export default async function AdminDashboardPage() {
  const [userCount, adminCount, productCount, totalBalance, logCount, recentErrors] =
    await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.product.count(),
    prisma.user.aggregate({ _sum: { balanceCents: true } }),
    prisma.systemLog.count(),
    prisma.systemLog.count({
      where: {
        severity: "ERROR",
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const balanceSum = totalBalance._sum.balanceCents ?? 0;

  return (
    <div>
      <p className="text-sage-600">
        Manage users, product catalog, and account balances from the sections below.
      </p>

      <dl className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-sage-200/80 bg-cream-50 p-6">
          <dt className="text-sm text-sage-600">Total users</dt>
          <dd className="mt-2 font-display text-3xl font-semibold text-sage-900">{userCount}</dd>
        </div>
        <div className="rounded-2xl border border-sage-200/80 bg-cream-50 p-6">
          <dt className="text-sm text-sage-600">Administrators</dt>
          <dd className="mt-2 font-display text-3xl font-semibold text-sage-900">{adminCount}</dd>
        </div>
        <div className="rounded-2xl border border-sage-200/80 bg-cream-50 p-6">
          <dt className="text-sm text-sage-600">Products</dt>
          <dd className="mt-2 font-display text-3xl font-semibold text-sage-900">{productCount}</dd>
        </div>
        <div className="rounded-2xl border border-sage-200/80 bg-cream-50 p-6">
          <dt className="text-sm text-sage-600">Combined user balances</dt>
          <dd className="mt-2 font-display text-2xl font-semibold text-sage-900">
            {new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
              balanceSum / 100,
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/logs"
          className="rounded-2xl border border-sage-200/80 bg-cream-50 p-6 transition-colors hover:border-sage-400 hover:bg-white"
        >
          <h2 className="font-display text-lg font-semibold text-sage-900">System log</h2>
          <p className="mt-2 text-sm text-sage-600">
            {logCount} events recorded
            {recentErrors > 0 ? ` · ${recentErrors} errors in the last 24h` : ""}
          </p>
        </Link>
        <Link
          href="/admin/users"
          className="rounded-2xl border border-sage-200/80 bg-cream-50 p-6 transition-colors hover:border-sage-400 hover:bg-white"
        >
          <h2 className="font-display text-lg font-semibold text-sage-900">Users</h2>
          <p className="mt-2 text-sm text-sage-600">
            View and edit accounts, roles, and balances.
          </p>
        </Link>
        <Link
          href="/admin/products"
          className="rounded-2xl border border-sage-200/80 bg-cream-50 p-6 transition-colors hover:border-sage-400 hover:bg-white"
        >
          <h2 className="font-display text-lg font-semibold text-sage-900">Products</h2>
          <p className="mt-2 text-sm text-sage-600">
            Create and update catalog items, pricing, and stock.
          </p>
        </Link>
      </div>
    </div>
  );
}
