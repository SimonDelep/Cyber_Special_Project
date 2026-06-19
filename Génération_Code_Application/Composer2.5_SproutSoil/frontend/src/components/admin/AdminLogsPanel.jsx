import { Fragment, useCallback, useEffect, useState } from "react";
import { adminApi } from "../../api/client";

const CATEGORIES = [
  { value: "", label: "All categories" },
  { value: "auth", label: "Auth" },
  { value: "profile", label: "Profile" },
  { value: "transaction", label: "Transaction" },
  { value: "admin", label: "Admin" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "true", label: "Success" },
  { value: "false", label: "Failed" },
];

function formatDetails(details) {
  if (!details) return null;
  try {
    return JSON.stringify(JSON.parse(details), null, 2);
  } catch {
    return details;
  }
}

export default function AdminLogsPanel() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const [category, setCategory] = useState("");
  const [success, setSuccess] = useState("");
  const [username, setUsername] = useState("");

  const loadLogs = useCallback(() => {
    setLoading(true);
    setError("");
    adminApi
      .listLogs({
        category: category || undefined,
        success: success === "" ? undefined : success === "true",
        username: username || undefined,
        limit: 100,
      })
      .then((data) => {
        setLogs(data.items);
        setTotal(data.total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [category, success, username]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <p className="text-soil-600">
          Internal system log — {total} event{total !== 1 ? "s" : ""} recorded
        </p>
        <button
          type="button"
          onClick={loadLogs}
          className="rounded-full border border-soil-200 px-4 py-2 text-sm font-medium text-soil-700 hover:bg-soil-100"
        >
          Refresh
        </button>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3 rounded-2xl border border-soil-200 bg-soil-50 p-4">
        <div>
          <label className="block text-xs font-medium text-soil-600 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-soil-200 bg-white px-3 py-2 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-soil-600 mb-1">Status</label>
          <select
            value={success}
            onChange={(e) => setSuccess(e.target.value)}
            className="w-full rounded-lg border border-soil-200 bg-white px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-soil-600 mb-1">Username</label>
          <input
            type="search"
            placeholder="Filter by user…"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-soil-200 bg-white px-3 py-2 text-sm"
          />
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </p>
      )}

      {loading ? (
        <p className="py-12 text-center text-soil-500">Loading logs…</p>
      ) : logs.length === 0 ? (
        <p className="py-12 text-center text-soil-500">No events match your filters.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-soil-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-soil-50 text-soil-600">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Message</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soil-100">
              {logs.map((log) => (
                <Fragment key={log.id}>
                  <tr className="hover:bg-soil-50/50">
                    <td className="px-4 py-3 whitespace-nowrap text-soil-500 text-xs">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-soil-100 px-2 py-0.5 text-xs font-medium capitalize">
                        {log.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-soil-700">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 text-soil-600">
                      {log.username || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                          log.success
                            ? "bg-sprout-500/10 text-sprout-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {log.success ? "OK" : "Failed"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-soil-700 max-w-xs truncate">
                      {log.message}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {log.details && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(expandedId === log.id ? null : log.id)
                          }
                          className="text-xs font-medium text-sprout-600 hover:underline"
                        >
                          {expandedId === log.id ? "Hide" : "Details"}
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandedId === log.id && log.details && (
                    <tr>
                      <td colSpan={7} className="px-4 py-3 bg-soil-50">
                        <pre className="overflow-x-auto text-xs text-soil-600 font-mono">
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
    </div>
  );
}
