import { useState } from "react";
import AdminUsersPanel from "../components/admin/AdminUsersPanel";
import AdminProductsPanel from "../components/admin/AdminProductsPanel";
import AdminLogsPanel from "../components/admin/AdminLogsPanel";

const TABS = [
  { id: "users", label: "Users" },
  { id: "products", label: "Products" },
  { id: "logs", label: "System log" },
];

export default function AdminPage() {
  const [tab, setTab] = useState("users");

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-display text-3xl font-bold text-soil-950">Admin panel</h1>
      <p className="mt-2 text-soil-600">
        Manage users, products, and monitor system events.
      </p>

      <div className="mt-8 flex gap-2 border-b border-soil-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? "border-sprout-500 text-sprout-600"
                : "border-transparent text-soil-500 hover:text-soil-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "users" && <AdminUsersPanel />}
        {tab === "products" && <AdminProductsPanel />}
        {tab === "logs" && <AdminLogsPanel />}
      </div>
    </div>
  );
}
