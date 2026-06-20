import { createSignal, Show } from "solid-js";
import AdminUsersPanel from "./AdminUsersPanel";
import AdminProductsPanel from "./AdminProductsPanel";
import AdminEventsPanel from "./AdminEventsPanel";

type Tab = "users" | "products" | "logs";

export default function AdminDashboard() {
  const [tab, setTab] = createSignal<Tab>("users");

  return (
    <div>
      <h1 class="font-display text-3xl font-semibold text-ink">Admin panel</h1>
      <p class="mt-2 text-muted">
        Manage users, products, and monitor internal system activity.
      </p>

      <div class="mt-8 flex gap-2 border-b border-brand-100">
        <button
          type="button"
          class={`border-b-2 px-4 py-2 text-sm font-semibold transition ${
            tab() === "users"
              ? "border-brand-600 text-brand-700"
              : "border-transparent text-muted hover:text-brand-700"
          }`}
          onClick={() => setTab("users")}
        >
          Users & balances
        </button>
        <button
          type="button"
          class={`border-b-2 px-4 py-2 text-sm font-semibold transition ${
            tab() === "products"
              ? "border-brand-600 text-brand-700"
              : "border-transparent text-muted hover:text-brand-700"
          }`}
          onClick={() => setTab("products")}
        >
          Products
        </button>
        <button
          type="button"
          class={`border-b-2 px-4 py-2 text-sm font-semibold transition ${
            tab() === "logs"
              ? "border-brand-600 text-brand-700"
              : "border-transparent text-muted hover:text-brand-700"
          }`}
          onClick={() => setTab("logs")}
        >
          System log
        </button>
      </div>

      <div class="mt-8">
        <Show when={tab() === "users"}>
          <AdminUsersPanel />
        </Show>
        <Show when={tab() === "products"}>
          <AdminProductsPanel />
        </Show>
        <Show when={tab() === "logs"}>
          <AdminEventsPanel />
        </Show>
      </div>
    </div>
  );
}
