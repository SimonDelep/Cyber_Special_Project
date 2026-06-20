"use client";

import { useRouter } from "next/navigation";
import type { LogSearchParams } from "@/lib/monitoring/query-logs";
import { LOG_TYPE_LABELS } from "@/types/system-log";
import type { SystemLogSeverity, SystemLogType } from "@prisma/client";

type LogFiltersProps = {
  params: LogSearchParams;
  types: SystemLogType[];
  severities: SystemLogSeverity[];
};

export function LogFilters({ params, types, severities }: LogFiltersProps) {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const search = new URLSearchParams();

    const q = (data.get("q") as string)?.trim();
    const type = data.get("type") as string;
    const severity = data.get("severity") as string;
    const limit = data.get("limit") as string;

    if (q) search.set("q", q);
    if (type && type !== "all") search.set("type", type);
    if (severity && severity !== "all") search.set("severity", severity);
    if (limit && limit !== "100") search.set("limit", limit);

    const query = search.toString();
    router.push(query ? `/admin/logs?${query}` : "/admin/logs");
  }

  function handleReset() {
    router.push("/admin/logs");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-2xl border border-sage-200/80 bg-cream-50 p-6 sm:grid-cols-2 lg:grid-cols-5"
    >
      <div className="sm:col-span-2">
        <label htmlFor="q" className="block text-sm font-medium text-sage-800">
          Search
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={params.q ?? ""}
          placeholder="Message or username…"
          className="mt-1.5 w-full rounded-lg border border-sage-300 bg-white px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-sage-800">
          Event type
        </label>
        <select
          id="type"
          name="type"
          defaultValue={params.type ?? "all"}
          className="mt-1.5 w-full rounded-lg border border-sage-300 bg-white px-3 py-2 text-sm"
        >
          <option value="all">All types</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {LOG_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="severity" className="block text-sm font-medium text-sage-800">
          Severity
        </label>
        <select
          id="severity"
          name="severity"
          defaultValue={params.severity ?? "all"}
          className="mt-1.5 w-full rounded-lg border border-sage-300 bg-white px-3 py-2 text-sm"
        >
          <option value="all">All</option>
          {severities.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="limit" className="block text-sm font-medium text-sage-800">
          Max rows
        </label>
        <select
          id="limit"
          name="limit"
          defaultValue={params.limit ?? "100"}
          className="mt-1.5 w-full rounded-lg border border-sage-300 bg-white px-3 py-2 text-sm"
        >
          <option value="50">50</option>
          <option value="100">100</option>
          <option value="200">200</option>
          <option value="500">500</option>
        </select>
      </div>
      <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-5">
        <button
          type="submit"
          className="rounded-full bg-sage-700 px-5 py-2 text-sm font-medium text-cream-50 hover:bg-sage-900"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-full border border-sage-300 px-5 py-2 text-sm font-medium text-sage-800 hover:bg-sage-50"
        >
          Clear
        </button>
      </div>
    </form>
  );
}
