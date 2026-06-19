"use client";

export type AdminTab = "users" | "products" | "logs";

type AdminTabsProps = {
  active: AdminTab;
  onChange: (tab: AdminTab) => void;
};

const tabs: { id: AdminTab; label: string }[] = [
  { id: "users", label: "Users" },
  { id: "products", label: "Products" },
  { id: "logs", label: "System log" },
];

export function AdminTabs({ active, onChange }: AdminTabsProps) {
  return (
    <div className="flex gap-2 border-b border-white/10 pb-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`rounded-full px-5 py-2 text-sm font-medium transition ${
            active === tab.id
              ? "bg-brand-500 text-white"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
