import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { Role } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Admin Panel",
};

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (user.role !== Role.ADMIN) redirect("/");

  const [userCount, productCount, sessionCount, logCount] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.session.count(),
    prisma.systemLog.count(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage">
          Administration
        </p>
        <h1 className="mt-2 font-display text-4xl font-medium text-charcoal">
          Admin Panel
        </h1>
        <p className="mt-2 text-sm text-stone">
          Manage users, balances, product catalog, and system event logs.
        </p>
      </div>

      <div className="mt-10">
        <AdminDashboard
          stats={{ userCount, productCount, sessionCount, logCount }}
        />
      </div>
    </div>
  );
}
