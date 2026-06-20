import { useCallback, useEffect, useState } from "react";
import * as adminApi from "../../api/admin";
import type { EventCategory, SystemEvent } from "../../types/systemEvent";

const categoryLabels: Record<EventCategory, string> = {
  auth: "Auth",
  profile: "Profile",
  transaction: "Transaction",
  admin: "Admin",
};

const severityStyles: Record<string, string> = {
  info: "bg-sky-50 text-sky-800",
  warning: "bg-amber-50 text-amber-900",
  error: "bg-red-50 text-red-800",
};

function formatTimestamp(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(iso));
}

function EventDetails({ details }: { details: Record<string, unknown> | null }) {
  if (!details || Object.keys(details).length === 0) return <span className="text-aura-400">—</span>;
  return (
    <pre className="max-w-xs overflow-x-auto whitespace-pre-wrap break-words rounded bg-aura-50 px-2 py-1 text-xs text-aura-700">
      {JSON.stringify(details, null, 2)}
    </pre>
  );
}

export default function LogsSection() {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState<EventCategory | "">("");
  const [successFilter, setSuccessFilter] = useState<"" | "true" | "false">("");
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const loadEvents = useCallback(() => {
    setLoading(true);
    setError("");
    adminApi
      .listEvents({
        category: category || undefined,
        success: successFilter === "" ? undefined : successFilter === "true",
        limit,
        offset,
      })
      .then((data) => {
        setEvents(data.items);
        setTotal(data.total);
      })
      .catch(() => setError("Could not load system logs."))
      .finally(() => setLoading(false));
  }, [category, successFilter, offset]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  function handleCategoryChange(value: string) {
    setCategory(value as EventCategory | "");
    setOffset(0);
  }

  function handleSuccessChange(value: string) {
    setSuccessFilter(value as "" | "true" | "false");
    setOffset(0);
  }

  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-aura-950">System log</h2>
          <p className="mt-1 text-sm text-aura-600">
            Internal audit trail for authentication, profile changes, and transactions.
          </p>
        </div>
        <button
          type="button"
          onClick={loadEvents}
          disabled={loading}
          className="rounded-full border border-aura-300 px-4 py-2 text-sm font-semibold text-aura-800 transition hover:border-aura-400 hover:bg-white disabled:opacity-60"
        >
          Refresh
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-4 rounded-xl border border-aura-200 bg-white p-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-aura-700">Category</span>
          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="rounded-lg border border-aura-200 px-3 py-2 text-sm outline-none ring-aura-400 focus:ring-2"
          >
            <option value="">All</option>
            {(Object.keys(categoryLabels) as EventCategory[]).map((cat) => (
              <option key={cat} value={cat}>
                {categoryLabels[cat]}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-aura-700">Status</span>
          <select
            value={successFilter}
            onChange={(e) => handleSuccessChange(e.target.value)}
            className="rounded-lg border border-aura-200 px-3 py-2 text-sm outline-none ring-aura-400 focus:ring-2"
          >
            <option value="">All</option>
            <option value="true">Success</option>
            <option value="false">Failed</option>
          </select>
        </label>

        <p className="self-end text-sm text-aura-600">
          {total} event{total !== 1 ? "s" : ""} total
        </p>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-16 animate-pulse rounded-lg bg-aura-200/60" />
          ))}
        </div>
      )}

      {!loading && events.length === 0 && !error && (
        <p className="rounded-lg border border-aura-200 bg-aura-50 px-4 py-8 text-center text-sm text-aura-600">
          No events recorded yet.
        </p>
      )}

      {!loading && events.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-aura-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-aura-200 bg-aura-50/80 text-xs uppercase tracking-wide text-aura-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Time</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Event</th>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Message</th>
                <th className="px-4 py-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aura-100">
              {events.map((event) => (
                <tr key={event.id} className="align-top hover:bg-aura-50/50">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-aura-600">
                    {formatTimestamp(event.created_at)}
                  </td>
                  <td className="px-4 py-3 capitalize text-aura-800">{event.category}</td>
                  <td className="px-4 py-3 font-mono text-xs text-aura-700">{event.event_type}</td>
                  <td className="px-4 py-3 text-aura-800">
                    {event.actor_username ?? (event.user_id ? `#${event.user_id}` : "—")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        event.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                      }`}
                    >
                      {event.success ? "OK" : "Failed"}
                    </span>
                    <span
                      className={`ml-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        severityStyles[event.severity] ?? severityStyles.info
                      }`}
                    >
                      {event.severity}
                    </span>
                  </td>
                  <td className="max-w-xs px-4 py-3 text-aura-800">{event.message}</td>
                  <td className="px-4 py-3">
                    <EventDetails details={event.details} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && total > limit && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <button
            type="button"
            disabled={!canPrev}
            onClick={() => setOffset((o) => Math.max(0, o - limit))}
            className="rounded-full border border-aura-300 px-4 py-2 font-medium text-aura-800 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-aura-600">
            {offset + 1}–{Math.min(offset + limit, total)} of {total}
          </span>
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setOffset((o) => o + limit)}
            className="rounded-full border border-aura-300 px-4 py-2 font-medium text-aura-800 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
