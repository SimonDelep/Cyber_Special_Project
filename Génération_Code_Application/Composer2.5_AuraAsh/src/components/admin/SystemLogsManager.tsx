"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatDate } from "@/lib/utils";
import type { SystemLogItem } from "@/types/admin";

type LogStats = {
  total: number;
  last24h: number;
  failures: number;
};

const statusStyles: Record<SystemLogItem["status"], string> = {
  SUCCESS: "bg-sage/15 text-sage",
  FAILURE: "bg-red-100 text-red-700",
  WARNING: "bg-amber-100 text-amber-800",
};

const categoryStyles: Record<SystemLogItem["category"], string> = {
  AUTH: "text-ember",
  PROFILE: "text-charcoal",
  TRANSACTION: "text-sage",
  ADMIN: "text-stone",
};

export function SystemLogsManager() {
  const [logs, setLogs] = useState<SystemLogItem[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        category,
        status,
        limit: "100",
      });
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/logs?${params}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Failed to load logs");

      setLogs(data.logs);
      setTotal(data.total);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load logs");
    } finally {
      setLoading(false);
    }
  }, [category, status, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total events", value: stats.total },
            { label: "Last 24 hours", value: stats.last24h },
            { label: "Failures", value: stats.failures },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-stone/15 bg-cream p-4 text-center"
            >
              <p className="font-display text-2xl text-charcoal">{stat.value}</p>
              <p className="mt-1 text-xs text-stone">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-stone/15 bg-warm-white p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            label="Search"
            name="search"
            placeholder="Message, action, username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            label="Category"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[
              { value: "ALL", label: "All categories" },
              { value: "AUTH", label: "Authentication" },
              { value: "PROFILE", label: "Profile" },
              { value: "TRANSACTION", label: "Transactions" },
              { value: "ADMIN", label: "Admin" },
            ]}
          />
          <Select
            label="Status"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: "ALL", label: "All statuses" },
              { value: "SUCCESS", label: "Success" },
              { value: "FAILURE", label: "Failure" },
              { value: "WARNING", label: "Warning" },
            ]}
          />
          <div className="flex items-end">
            <Button variant="secondary" onClick={fetchLogs} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
        <p className="mt-3 text-sm text-stone">
          Showing {logs.length} of {total} events
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-stone/15 bg-warm-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-stone/15 bg-cream/60 text-xs uppercase tracking-wide text-stone">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Message</th>
                <th className="px-4 py-3 font-medium">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone/10">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-stone">
                    Loading system logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-stone">
                    No events recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="align-top hover:bg-cream/40">
                    <td className="whitespace-nowrap px-4 py-3 text-stone">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className={`px-4 py-3 font-medium ${categoryStyles[log.category]}`}>
                      {log.category}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-charcoal">
                      {log.action}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[log.status]}`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-charcoal">
                      {log.username ?? "—"}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-stone">
                      <p>{log.message}</p>
                      {log.metadata != null && (
                        <pre className="mt-2 overflow-x-auto rounded-lg bg-cream p-2 text-[11px] text-charcoal">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-stone">
                      {log.ipAddress ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
