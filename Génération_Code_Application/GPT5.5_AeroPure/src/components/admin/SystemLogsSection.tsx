"use client";

import { useCallback, useEffect, useState } from "react";
import type { SystemLogEntry } from "@/lib/logging/types";

const CATEGORIES = [
  "ALL",
  "AUTH",
  "PROFILE",
  "TRANSACTION",
  "CART",
  "ADMIN",
  "REVIEW",
  "SYSTEM",
] as const;

const LEVELS = ["ALL", "INFO", "SUCCESS", "WARN", "ERROR"] as const;

const LEVEL_STYLES: Record<string, string> = {
  INFO: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  SUCCESS: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  WARN: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  ERROR: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
};

export function SystemLogsSection() {
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>("ALL");
  const [level, setLevel] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "ALL") params.set("category", category);
    if (level !== "ALL") params.set("level", level);
    if (search.trim()) params.set("q", search.trim());
    params.set("limit", "200");

    try {
      const res = await fetch(`/api/admin/logs?${params.toString()}`);
      const data = await res.json();
      if (res.ok) setLogs(data.logs);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [category, level, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Internal audit trail of user actions — login attempts, profile changes,
        transactions, and admin operations.
      </p>

      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search logs…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[200px] flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c === "ALL" ? "All categories" : c}
            </option>
          ))}
        </select>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l === "ALL" ? "All levels" : l}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={fetchLogs}
          className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-dark"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-muted">Loading logs…</div>
      ) : logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center text-muted">
          No log entries match your filters.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Level</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Message</th>
                <th className="px-4 py-3 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-border last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {new Date(log.createdAt).toLocaleString("fr-CA")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${LEVEL_STYLES[log.level] ?? ""}`}
                    >
                      {log.level}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{log.category}</td>
                  <td className="px-4 py-3 font-medium">
                    {log.username ?? "—"}
                  </td>
                  <td className="max-w-md px-4 py-3">
                    <p>{log.message}</p>
                    <p className="mt-0.5 font-mono text-xs text-muted">
                      {log.action}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {log.ipAddress ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
