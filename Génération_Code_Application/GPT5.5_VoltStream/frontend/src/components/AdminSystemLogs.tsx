import { useCallback, useEffect, useState } from "react";
import { fetchAdminLogs, type SystemLog, type SystemLogQuery } from "../api/admin";

const EVENT_LABELS: Record<string, string> = {
  "auth.login.success": "Login success",
  "auth.login.failure": "Login failure",
  "auth.register.success": "Register success",
  "auth.register.failure": "Register failure",
  "profile.update": "Profile update",
  "transaction.checkout.success": "Checkout success",
  "transaction.checkout.failure": "Checkout failure",
};

function eventLabel(type: string): string {
  return EVENT_LABELS[type] ?? type;
}

function severityClass(severity: string, success: boolean): string {
  if (!success || severity === "error") return "text-amber-400 bg-amber-400/10";
  if (severity === "warning") return "text-yellow-300 bg-yellow-400/10";
  return "text-emerald-400 bg-emerald-400/10";
}

export default function AdminSystemLogs() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SystemLogQuery>({ limit: 50, offset: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminLogs(filters);
      setLogs(data.items);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load logs");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const page = Math.floor((filters.offset ?? 0) / (filters.limit ?? 50));
  const pageSize = filters.limit ?? 50;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-grid-border bg-grid-surface/60 p-4">
        <label className="text-sm text-grid-muted">
          Event type
          <select
            value={filters.event_type ?? ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                event_type: e.target.value || undefined,
                offset: 0,
              }))
            }
            className="mt-1 block rounded-lg border border-grid-border bg-grid-dark px-3 py-2 text-white"
          >
            <option value="">All events</option>
            {Object.entries(EVENT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-grid-muted">
          Severity
          <select
            value={filters.severity ?? ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                severity: e.target.value || undefined,
                offset: 0,
              }))
            }
            className="mt-1 block rounded-lg border border-grid-border bg-grid-dark px-3 py-2 text-white"
          >
            <option value="">All</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
        </label>
        <button
          type="button"
          onClick={load}
          className="rounded-lg border border-grid-border px-4 py-2 text-sm font-medium text-white hover:border-grid-cyan/50"
        >
          Refresh
        </button>
        <p className="ml-auto text-sm text-grid-muted">
          {total} event{total !== 1 ? "s" : ""} total
        </p>
      </div>

      {error && <p className="mt-4 text-sm text-amber-400">{error}</p>}
      {loading && <p className="mt-8 text-grid-muted">Loading system logs…</p>}

      {!loading && logs.length === 0 && (
        <p className="mt-8 text-center text-grid-muted">No log entries match your filters.</p>
      )}

      {!loading && logs.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-grid-border">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-grid-border bg-grid-surface/80 text-grid-muted">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-grid-border/50 hover:bg-grid-surface/40 align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-grid-muted">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-white">{eventLabel(log.event_type)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-semibold uppercase ${severityClass(
                        log.severity,
                        log.success
                      )}`}
                    >
                      {log.success ? log.severity : "failed"}
                    </span>
                  </td>
                  <td className="max-w-xs px-4 py-3 text-grid-muted">{log.message}</td>
                  <td className="px-4 py-3 text-grid-muted">
                    {log.actor_email ?? (log.actor_user_id ? `#${log.actor_user_id}` : "—")}
                    {log.target_user_id != null && log.target_user_id !== log.actor_user_id && (
                      <span className="block text-xs">→ user #{log.target_user_id}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-grid-muted">{log.ip_address ?? "—"}</td>
                  <td className="max-w-[200px] px-4 py-3">
                    {log.details ? (
                      <pre className="overflow-x-auto text-xs text-grid-muted">
                        {JSON.stringify(log.details, null, 0)}
                      </pre>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setFilters((f) => ({ ...f, offset: Math.max(0, (f.offset ?? 0) - pageSize) }))}
            className="rounded-lg border border-grid-border px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-grid-muted">
            Page {page + 1} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page + 1 >= totalPages}
            onClick={() => setFilters((f) => ({ ...f, offset: (f.offset ?? 0) + pageSize }))}
            className="rounded-lg border border-grid-border px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
