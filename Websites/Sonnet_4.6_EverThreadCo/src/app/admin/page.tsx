import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Admin dashboard",
};

export default async function AdminDashboardPage() {
  const [userCount, productCount, balanceRows, eventCount24h] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.user.findMany({ select: { balanceCents: true } }),
    prisma.systemEvent.count({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
  ]);

  const totalBalanceCents = balanceRows.reduce(
    (sum, row) => sum + row.balanceCents,
    0,
  );

  const cards = [
    { label: "Users", value: userCount, href: "/admin/users" },
    { label: "Products", value: productCount, href: "/admin/products" },
    {
      label: "Events (24h)",
      value: eventCount24h,
      href: "/admin/logs",
    },
    {
      label: "Total user balances",
      value: formatPrice(totalBalanceCents),
      href: "/admin/users",
    },
  ];

  return (
    <div>
      <h2 className="font-display text-2xl text-sand-900">Overview</h2>
      <p className="mt-1 text-sm text-sand-600">
        Manage users, product catalog, and account balances.
      </p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-2xl border border-sand-200 bg-cream-50 p-6 transition-shadow hover:shadow-md"
          >
            <dt className="text-sm text-sand-600">{card.label}</dt>
            <dd className="mt-1 font-display text-3xl text-sand-900">
              {card.value}
            </dd>
          </Link>
        ))}
      </dl>
    </div>
  );
}
