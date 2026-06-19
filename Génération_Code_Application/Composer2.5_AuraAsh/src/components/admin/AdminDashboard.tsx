"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ProductsManager } from "./ProductsManager";
import { SystemLogsManager } from "./SystemLogsManager";
import { UsersManager } from "./UsersManager";

const tabs = [
  { id: "users", label: "Users" },
  { id: "products", label: "Products" },
  { id: "logs", label: "System Logs" },
] as const;

type TabId = (typeof tabs)[number]["id"];

interface AdminDashboardProps {
  stats: {
    userCount: number;
    productCount: number;
    sessionCount: number;
    logCount: number;
  };
}

export function AdminDashboard({ stats }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>("users");

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Users", value: stats.userCount },
          { label: "Products", value: stats.productCount },
          { label: "Active Sessions", value: stats.sessionCount },
          { label: "System Events", value: stats.logCount },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-stone/15 bg-cream p-5 text-center"
          >
            <p className="font-display text-3xl text-charcoal">{stat.value}</p>
            <p className="mt-1 text-sm text-stone">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="border-b border-stone/15">
        <nav className="-mb-px flex gap-6" aria-label="Admin sections">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "border-b-2 pb-3 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "border-ember text-ember"
                  : "border-transparent text-stone hover:text-charcoal",
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "users" && <UsersManager />}
      {activeTab === "products" && <ProductsManager />}
      {activeTab === "logs" && <SystemLogsManager />}
    </div>
  );
}
