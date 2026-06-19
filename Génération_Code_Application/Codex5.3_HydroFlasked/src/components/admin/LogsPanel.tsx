"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import type { LogCategory, LogStatus } from "../../../generated/prisma/client";
import type { AdminSystemLog } from "@/lib/audit/serializers";
import { parseApiResponse } from "@/lib/parse-api-response";

const CATEGORIES: { value: "" | LogCategory; label: string }[] = [
  { value: "", label: "All categories" },
  { value: "AUTH", label: "Authentication" },
  { value: "PROFILE", label: "Profile" },
  { value: "TRANSACTION", label: "Transactions" },
  { value: "ADMIN", label: "Admin" },
];

const STATUSES: { value: "" | LogStatus; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "SUCCESS", label: "Success" },
  { value: "FAILURE", label: "Failure" },
  { value: "INFO", label: "Info" },
];

const statusStyles: Record<LogStatus, string> = {
  SUCCESS: "bg-emerald-500/15 text-emerald-300",
  FAILURE: "bg-red-500/15 text-red-300",
  INFO: "bg-sky-500/15 text-sky-300",
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function LogsPanel() {
  const [logs, setLogs] = useState<AdminSystemLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 1,
  });
  const [category, setCategory] = useState<"" | LogCategory>("");
  const [status, setStatus] = useState<"" | LogStatus>("");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (category) params.set("category", category);
      if (status) params.set("status", status);
      if (appliedSearch) params.set("q", appliedSearch);

      const res = await fetch(`/api/admin/logs?${params}`);
      const data = await parseApiResponse(res);

      if (!res.ok) {
        setError((data.error as string) ?? "Failed to load logs");
        return;
      }

      setLogs(data.logs as AdminSystemLog[]);
      setPagination(data.pagination as Pagination);
    } catch {
      setError("Network error while loading logs.");
    } finally {
      setLoading(false);
    }
  }, [page, category, status, appliedSearch]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim());
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">System log</h2>
        <p className="mt-1 text-sm text-slate-400">
          Internal audit trail for sign-in attempts, profile updates, checkout, and admin
          actions.
        </p>
      </div>

      <form
        onSubmit={handleSearchSubmit}
        className="flex flex-wrap items-end gap-4 rounded-2xl border border-white/10 bg-slate-900/50 p-4"
      >
        <label className="min-w-[140px] flex-1">
          <span className="text-xs text-slate-400">Search</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Message, username, action…"
            className="mt-1 w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
          />
        </label>
        <label>
          <span className="text-xs text-slate-400">Category</span>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as "" | LogCategory);
              setPage(1);
            }}
            className="mt-1 block rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value || "all"} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="text-xs text-slate-400">Status</span>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as "" | LogStatus);
              setPage(1);
            }}
            className="mt-1 block rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
          >
            {STATUSES.map((s) => (
              <option key={s.value || "all"} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-400"
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => void fetchLogs()}
          disabled={loading}
          className="rounded-full border border-white/20 px-5 py-2 text-sm text-slate-200 hover:border-white/40 disabled:opacity-50"
        >
          Refresh
        </button>
      </form>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-white/10 bg-slate-900/80 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Message</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading && logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Loading events…
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No log entries match your filters.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <Fragment key={log.id}>
                  <tr className="hover:bg-white/[0.02]">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                      {new Date(log.createdAt).toLocaleString("en-CA")}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{log.category}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      {log.action}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[log.status]}`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {log.username ?? "—"}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-200">
                      {log.message}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(expandedId === log.id ? null : log.id)
                        }
                        className="text-xs text-brand-400 hover:text-brand-300"
                      >
                        {expandedId === log.id ? "Hide" : "Details"}
                      </button>
                    </td>
                  </tr>
                  {expandedId === log.id ? (
                    <tr key={`${log.id}-detail`}>
                      <td colSpan={7} className="bg-slate-950/60 px-4 py-4">
                        <dl className="grid gap-2 text-xs sm:grid-cols-2">
                          <div>
                            <dt className="text-slate-500">IP</dt>
                            <dd className="font-mono text-slate-300">
                              {log.ipAddress ?? "—"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">User agent</dt>
                            <dd className="break-all text-slate-300">
                              {log.userAgent ?? "—"}
                            </dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="text-slate-500">Metadata</dt>
                            <dd>
                              <pre className="mt-1 overflow-x-auto rounded-lg bg-slate-900 p-3 font-mono text-xs text-slate-300">
                                {log.metadata
                                  ? JSON.stringify(log.metadata, null, 2)
                                  : "—"}
                              </pre>
                            </dd>
                          </div>
                        </dl>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-400">
        <p>
          {pagination.total} event{pagination.total !== 1 ? "s" : ""} · page{" "}
          {pagination.page} of {pagination.totalPages}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-white/15 px-3 py-1 disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= pagination.totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-white/15 px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
