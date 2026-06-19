"use client";

import { useState } from "react";
import type { AdminUser, AdminProduct } from "@/types/admin";
import { UsersSection } from "@/components/admin/UsersSection";
import { ProductsSection } from "@/components/admin/ProductsSection";
import { SystemLogsSection } from "@/components/admin/SystemLogsSection";

type Tab = "users" | "products" | "logs";

type AdminPanelProps = {
  initialUsers: AdminUser[];
  initialProducts: AdminProduct[];
};

export function AdminPanel({ initialUsers, initialProducts }: AdminPanelProps) {
  const [tab, setTab] = useState<Tab>("users");
  const [message, setMessage] = useState<string | null>(null);

  const tabs: { id: Tab; label: string }[] = [
    { id: "users", label: "Users" },
    { id: "products", label: "Products" },
    { id: "logs", label: "System logs" },
  ];

  return (
    <div>
      {message && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
          {message}
        </div>
      )}

      <div className="flex gap-2 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              tab === t.id
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "users" && (
          <UsersSection
            initialUsers={initialUsers}
            onNotify={setMessage}
          />
        )}
        {tab === "products" && (
          <ProductsSection
            initialProducts={initialProducts}
            onNotify={setMessage}
          />
        )}
        {tab === "logs" && <SystemLogsSection />}
      </div>
    </div>
  );
}
