"use client";

import { Fragment, useCallback, useEffect, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import type {
  SystemLogCategory,
  SystemLogLevel,
} from "@/generated/prisma/enums";

type SystemLogRow = {
  id: string;
  category: SystemLogCategory;
  action: string;
  level: SystemLogLevel;
  message: string;
  userId: string | null;
  username: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: unknown;
  success: boolean;
  createdAt: string;
};

type LogsResponse = {
  logs: SystemLogRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const levelStyles: Record<SystemLogLevel, string> = {
  INFO: "bg-sage/20 text-espresso",
  WARN: "bg-amber-100 text-amber-900",
  ERROR: "bg-red-100 text-red-800",
};

const categoryStyles: Record<SystemLogCategory, string> = {
  AUTH: "bg-espresso/10 text-espresso",
  PROFILE: "bg-sage/25 text-sage-dark",
  TRANSACTION: "bg-linen text-espresso",
  ADMIN: "bg-espresso text-cream",
  SYSTEM: "bg-cream text-espresso/80",
};

function formatTimestamp(iso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function formatMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  try {
    return JSON.stringify(metadata, null, 2);
  } catch {
    return null;
  }
}

export function SystemLogsManager() {
  const [filters, setFilters] = useState({
    q: "",
    category: "",
    level: "",
    success: "",
    page: 1,
  });
  const [data, setData] = useState<LogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.category) params.set("category", filters.category);
    if (filters.level) params.set("level", filters.level);
    if (filters.success) params.set("success", filters.success);
    params.set("page", String(filters.page));
    params.set("limit", "50");

    const res = await fetch(`/api/admin/logs?${params.toString()}`);
    const json = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(json.error ?? "Failed to load logs");
      return;
    }

    setData(json as LogsResponse);
  }, [filters]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, page: 1 }));
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={applyFilters}
        className="rounded-2xl border border-sage/25 bg-linen p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="log-q">Search</Label>
            <Input
              id="log-q"
              value={filters.q}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, q: e.target.value }))
              }
              placeholder="Message, username, action…"
            />
          </div>
          <Select
            label="Category"
            name="category"
            value={filters.category}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, category: e.target.value }))
            }
          >
            <option value="">All categories</option>
            <option value="AUTH">Auth</option>
            <option value="PROFILE">Profile</option>
            <option value="TRANSACTION">Transaction</option>
            <option value="ADMIN">Admin</option>
            <option value="SYSTEM">System</option>
          </Select>
          <Select
            label="Level"
            name="level"
            value={filters.level}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, level: e.target.value }))
            }
          >
            <option value="">All levels</option>
            <option value="INFO">Info</option>
            <option value="WARN">Warning</option>
            <option value="ERROR">Error</option>
          </Select>
          <Select
            label="Outcome"
            name="success"
            value={filters.success}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, success: e.target.value }))
            }
          >
            <option value="">All outcomes</option>
            <option value="true">Success</option>
            <option value="false">Failed</option>
          </Select>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="submit">Apply filters</Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setFilters({
                q: "",
                category: "",
                level: "",
                success: "",
                page: 1,
              });
            }}
          >
            Clear
          </Button>
          <Button type="button" variant="ghost" onClick={() => void loadLogs()}>
            Refresh
          </Button>
        </div>
      </form>

      {error && <Alert variant="error">{error}</Alert>}

      {loading && (
        <p className="text-sm text-espresso/60">Loading system logs…</p>
      )}

      {!loading && data && (
        <>
          <p className="text-sm text-espresso/60">
            {data.pagination.total} event
            {data.pagination.total !== 1 ? "s" : ""} · page{" "}
            {data.pagination.page} of {data.pagination.totalPages || 1}
          </p>

          {data.logs.length === 0 ? (
            <p className="rounded-2xl border border-sage/25 bg-cream/60 p-8 text-center text-sm text-espresso/70">
              No log entries match your filters.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-sage/25">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-sage/25 bg-linen text-xs uppercase tracking-wider text-espresso/60">
                  <tr>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Message</th>
                    <th className="px-4 py-3">Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sage/15 bg-cream/40">
                  {data.logs.map((log) => {
                    const meta = formatMetadata(log.metadata);
                    const isExpanded = expandedId === log.id;

                    return (
                      <Fragment key={log.id}>
                        <tr
                          className="cursor-pointer hover:bg-sage/10"
                          onClick={() =>
                            setExpandedId(isExpanded ? null : log.id)
                          }
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-espresso/70">
                            {formatTimestamp(log.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryStyles[log.category]}`}
                            >
                              {log.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-espresso">
                            {log.action}
                          </td>
                          <td className="px-4 py-3 text-espresso">
                            {log.username ?? "—"}
                          </td>
                          <td className="max-w-xs truncate px-4 py-3 text-espresso/80">
                            {log.message}
                            {!log.success && (
                              <span className="ml-2 text-xs text-red-700">
                                failed
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${levelStyles[log.level]}`}
                            >
                              {log.level}
                            </span>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${log.id}-detail`} className="bg-linen/50">
                            <td colSpan={6} className="px-4 py-4 text-xs">
                              <dl className="grid gap-2 sm:grid-cols-2">
                                <div>
                                  <dt className="text-espresso/50">IP</dt>
                                  <dd className="font-mono text-espresso">
                                    {log.ipAddress ?? "—"}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-espresso/50">User agent</dt>
                                  <dd className="break-all text-espresso/80">
                                    {log.userAgent ?? "—"}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-espresso/50">User ID</dt>
                                  <dd className="font-mono text-espresso">
                                    {log.userId ?? "—"}
                                  </dd>
                                </div>
                              </dl>
                              {meta && (
                                <pre className="mt-3 overflow-x-auto rounded-lg bg-espresso/5 p-3 font-mono text-espresso/80">
                                  {meta}
                                </pre>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={filters.page <= 1}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
              >
                Previous
              </Button>
              <span className="text-sm text-espresso/70">
                Page {filters.page} of {data.pagination.totalPages}
              </span>
              <Button
                type="button"
                variant="secondary"
                disabled={filters.page >= data.pagination.totalPages}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    page: prev.page + 1,
                  }))
                }
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
