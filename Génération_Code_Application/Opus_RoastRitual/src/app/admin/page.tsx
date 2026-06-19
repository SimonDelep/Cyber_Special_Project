import Link from "next/link";

import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatCents } from "@/lib/format";

export const metadata = {
  title: "Admin overview | RoastRitual",
};

export default async function AdminOverviewPage() {
  await requireAdmin();

  const [userCount, productCount, logCount, totalBalance] = await Promise.all([
    db.user.count(),
    db.product.count(),
    db.systemLog.count(),
    db.user.aggregate({ _sum: { balanceCents: true } }),
  ]);

  const stats = [
    { label: "Users", value: userCount, href: "/admin/users" },
    { label: "Products", value: productCount, href: "/admin/products" },
    { label: "System log events", value: logCount, href: "/admin/logs" },
    {
      label: "Total user balances",
      value: formatCents(totalBalance._sum.balanceCents ?? 0),
      href: "/admin/users",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-2xl border border-sage/25 bg-cream/60 p-6 transition-shadow hover:shadow-md"
          >
            <p className="text-sm text-espresso/60">{stat.label}</p>
            <p className="mt-2 font-display text-2xl text-espresso">
              {stat.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-sage/25 bg-sage/10 p-6 text-sm text-espresso/80">
        <p className="font-medium text-espresso">Quick guide</p>
        <ul className="mt-3 list-inside list-disc space-y-1">
          <li>
            <strong>Users</strong> — edit profiles, roles, and adjust account
            balances (credits or debits).
          </li>
          <li>
            <strong>Products</strong> — create and update coffee/tea catalog
            items.
          </li>
          <li>
            <strong>System logs</strong> — review login attempts, profile
            updates, checkout activity, and admin balance changes.
          </li>
        </ul>
      </div>
    </div>
  );
}
