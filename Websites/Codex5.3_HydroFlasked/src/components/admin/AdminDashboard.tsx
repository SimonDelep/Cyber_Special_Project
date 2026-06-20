"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "../../../generated/prisma/client";
import type { AdminUser } from "@/lib/admin/serializers";
import { AdminTabs, type AdminTab } from "./AdminTabs";
import { UsersPanel } from "./UsersPanel";
import { ProductsPanel } from "./ProductsPanel";
import { LogsPanel } from "./LogsPanel";

type AdminDashboardProps = {
  adminUsername: string;
  currentAdminId: string;
  initialUsers: AdminUser[];
  initialProducts: Product[];
};

export function AdminDashboard({
  adminUsername,
  currentAdminId,
  initialUsers,
  initialProducts,
}: AdminDashboardProps) {
  const [tab, setTab] = useState<AdminTab>("users");

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-brand-400">
            Administrator
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">Admin panel</h1>
          <p className="mt-2 text-slate-400">
            Signed in as <strong className="text-white">{adminUsername}</strong> — manage users,
            balances, products, and the system log.
          </p>
        </div>
        <Link href="/profile" className="text-sm text-brand-400 hover:text-brand-300">
          ← My profile
        </Link>
      </div>

      <AdminTabs active={tab} onChange={setTab} />

      {tab === "users" ? (
        <UsersPanel initialUsers={initialUsers} currentAdminId={currentAdminId} />
      ) : tab === "products" ? (
        <ProductsPanel initialProducts={initialProducts} />
      ) : (
        <LogsPanel />
      )}
    </div>
  );
}
