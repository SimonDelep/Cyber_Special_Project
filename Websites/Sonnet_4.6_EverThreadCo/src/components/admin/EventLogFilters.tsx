"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const CATEGORIES = ["all", "AUTH", "PROFILE", "TRANSACTION", "CART", "ADMIN", "REVIEW", "SYSTEM"];
const SEVERITIES = ["all", "INFO", "WARN", "ERROR"];

type EventLogFiltersProps = {
  current: {
    q: string;
    category: string;
    severity: string;
    action: string;
  };
};

export function EventLogFilters({ current }: EventLogFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function apply(formData: FormData) {
    const params = new URLSearchParams();
    const q = formData.get("q")?.toString().trim();
    const category = formData.get("category")?.toString();
    const severity = formData.get("severity")?.toString();
    const action = formData.get("action")?.toString().trim();

    if (q) params.set("q", q);
    if (category && category !== "all") params.set("category", category);
    if (severity && severity !== "all") params.set("severity", severity);
    if (action) params.set("action", action);

    startTransition(() => {
      router.push(`/admin/logs?${params.toString()}`);
    });
  }

  function clear() {
    startTransition(() => router.push("/admin/logs"));
  }

  return (
    <form
      action={apply}
      className="rounded-2xl border border-sand-200 bg-cream-50 p-6"
    >
      <h2 className="font-display text-lg text-sand-900">Filter events</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Search"
          name="q"
          defaultValue={current.q}
          placeholder="Message, user, action…"
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="category" className="text-sm font-medium text-sand-800">
            Category
          </label>
          <select
            id="category"
            name="category"
            defaultValue={current.category}
            className="rounded-xl border border-sand-300 bg-cream-50 px-4 py-2.5 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All categories" : c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="severity" className="text-sm font-medium text-sand-800">
            Severity
          </label>
          <select
            id="severity"
            name="severity"
            defaultValue={current.severity}
            className="rounded-xl border border-sand-300 bg-cream-50 px-4 py-2.5 text-sm"
          >
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All severities" : s}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Action"
          name="action"
          defaultValue={current.action}
          placeholder="e.g. LOGIN_SUCCESS"
        />
      </div>
      <div className="mt-4 flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Applying…" : "Apply"}
        </Button>
        <Button type="button" variant="secondary" onClick={clear}>
          Clear
        </Button>
      </div>
    </form>
  );
}
