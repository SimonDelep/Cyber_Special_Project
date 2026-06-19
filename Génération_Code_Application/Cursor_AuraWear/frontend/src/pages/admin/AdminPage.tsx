import { useState } from "react";
import LogsSection from "./LogsSection";
import ProductsSection from "./ProductsSection";
import UsersSection from "./UsersSection";

type Tab = "users" | "products" | "logs";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("users");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-aura-950">Admin panel</h1>
        <p className="mt-2 text-sm text-aura-600">
          Manage users, wallet balances, product catalog, and system event logs.
        </p>
      </div>

      <div className="mb-8 flex gap-2 rounded-full border border-aura-200 bg-white p-1 shadow-sm w-fit">
        {(
          [
            ["users", "Users"],
            ["products", "Products"],
            ["logs", "System log"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              tab === id
                ? "bg-aura-950 text-aura-50"
                : "text-aura-700 hover:text-aura-950"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "users" && <UsersSection />}
      {tab === "products" && <ProductsSection />}
      {tab === "logs" && <LogsSection />}
    </div>
  );
}
