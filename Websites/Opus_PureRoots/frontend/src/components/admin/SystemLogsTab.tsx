import { FormEvent, Fragment, useCallback, useEffect, useState } from "react";
import * as adminApi from "../../api/admin";
import { EVENT_TYPE_LABELS, type SystemLog } from "../../types/systemLog";

const inputClass =
  "rounded-lg border border-forest-200 px-3 py-2 text-sm focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-200";

const PAGE_SIZE = 50;

export default function SystemLogsTab() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [eventType, setEventType] = useState("");
  const [username, setUsername] = useState("");
  const [successFilter, setSuccessFilter] = useState<"" | "true" | "false">("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = useCallback(
    async (off = 0) => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminApi.fetchSystemLogs({
          limit: PAGE_SIZE,
          offset: off,
          event_type: eventType || undefined,
          username: username || undefined,
          success: successFilter === "" ? undefined : successFilter === "true",
        });
        setLogs(res.items);
        setTotal(res.total);
        setOffset(off);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load logs");
      } finally {
        setLoading(false);
      }
    },
    [eventType, username, successFilter]
  );

  useEffect(() => {
    load(0);
  }, [load]);

  function handleFilter(e: FormEvent) {
    e.preventDefault();
    load(0);
  }

  function formatDetails(details: string | null) {
    if (!details) return null;
    try {
      return JSON.stringify(JSON.parse(details), null, 2);
    } catch {
      return details;
    }
  }

  return (
    <div>
      <p className="text-sm text-stone-600">
        Internal audit trail for logins, profile changes, checkouts, and admin actions.
      </p>

      <form
        onSubmit={handleFilter}
        className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-forest-200/80 bg-white p-4 shadow-sm"
      >
        <label className="text-sm">
          <span className="block text-xs font-medium text-stone-600">Event type</span>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className={`${inputClass} mt-1 min-w-[180px]`}
          >
            <option value="">All events</option>
            {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-xs font-medium text-stone-600">Username</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Filter by user"
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="text-sm">
          <span className="block text-xs font-medium text-stone-600">Status</span>
          <select
            value={successFilter}
            onChange={(e) => setSuccessFilter(e.target.value as "" | "true" | "false")}
            className={`${inputClass} mt-1`}
          >
            <option value="">All</option>
            <option value="true">Success</option>
            <option value="false">Failed</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded-full bg-forest-600 px-5 py-2 text-sm font-semibold text-white hover:bg-forest-700"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={() => load(offset)}
          className="rounded-full border border-forest-200 px-5 py-2 text-sm font-medium text-forest-700 hover:bg-forest-50"
        >
          Refresh
        </button>
      </form>

      <p className="mt-4 text-sm text-stone-600">
        {loading ? "Loading…" : `${total} event${total === 1 ? "" : "s"} total`}
      </p>

      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {!loading && logs.length === 0 && !error && (
        <p className="mt-8 text-center text-stone-600">No log entries match your filters.</p>
      )}

      {!loading && logs.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-forest-200/80 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-forest-200 bg-forest-50/80">
              <tr>
                <th className="px-4 py-3 font-medium text-forest-700">Time</th>
                <th className="px-4 py-3 font-medium text-forest-700">Event</th>
                <th className="px-4 py-3 font-medium text-forest-700">User</th>
                <th className="px-4 py-3 font-medium text-forest-700">IP</th>
                <th className="px-4 py-3 font-medium text-forest-700">Status</th>
                <th className="px-4 py-3 font-medium text-forest-700">Message</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <Fragment key={log.id}>
                  <tr
                    className="cursor-pointer border-b border-forest-100 hover:bg-forest-50/50"
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-stone-600">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-forest-100 px-2 py-0.5 text-xs font-medium text-forest-800">
                        {EVENT_TYPE_LABELS[log.event_type] ?? log.event_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">{log.username ? `@${log.username}` : "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-stone-500">
                      {log.ip_address ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {log.success ? (
                        <span className="text-green-700">OK</span>
                      ) : (
                        <span className="font-medium text-red-600">Failed</span>
                      )}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-stone-700">{log.message}</td>
                  </tr>
                  {expandedId === log.id && log.details && (
                    <tr className="border-b border-forest-100 bg-forest-50/30">
                      <td colSpan={6} className="px-4 py-3">
                        <pre className="overflow-x-auto rounded-lg bg-white p-3 text-xs text-stone-700">
                          {formatDetails(log.details)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > PAGE_SIZE && (
        <div className="mt-4 flex justify-between">
          <button
            type="button"
            disabled={offset === 0}
            onClick={() => load(Math.max(0, offset - PAGE_SIZE))}
            className="rounded-full border border-forest-200 px-4 py-2 text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-stone-600">
            {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
          </span>
          <button
            type="button"
            disabled={offset + PAGE_SIZE >= total}
            onClick={() => load(offset + PAGE_SIZE)}
            className="rounded-full border border-forest-200 px-4 py-2 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
