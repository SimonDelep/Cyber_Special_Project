import Link from "next/link";
import type { EventCategory, EventSeverity } from "@/generated/prisma/client";

export type EventLogRow = {
  id: string;
  category: EventCategory;
  action: string;
  severity: EventSeverity;
  message: string;
  username: string | null;
  userId: string | null;
  ipAddress: string | null;
  metadata: unknown;
  createdAt: string;
};

const severityStyles: Record<EventSeverity, string> = {
  INFO: "bg-sage-100 text-sage-800",
  WARN: "bg-amber-100 text-amber-900",
  ERROR: "bg-red-100 text-red-800",
};

type EventLogTableProps = {
  events: EventLogRow[];
  page: number;
  totalPages: number;
  totalCount: number;
  queryString: string;
};

function pageHref(queryString: string, page: number) {
  const params = new URLSearchParams(queryString);
  params.set("page", String(page));
  const qs = params.toString();
  return `/admin/logs${qs ? `?${qs}` : ""}`;
}

export function EventLogTable({
  events,
  page,
  totalPages,
  totalCount,
  queryString,
}: EventLogTableProps) {
  return (
    <div>
      <p className="text-sm text-sand-600">
        {totalCount} event{totalCount !== 1 ? "s" : ""} · page {page} of{" "}
        {totalPages || 1}
      </p>

      <div className="mt-4 overflow-x-auto rounded-xl border border-sand-200">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="bg-cream-100 text-sand-600">
            <tr>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Severity</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Message</th>
              <th className="px-4 py-3 font-medium">IP</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sand-500">
                  No events match your filters.
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id} className="border-t border-sand-100 align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-sand-600">
                    {new Date(event.createdAt).toLocaleString("en-CA")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityStyles[event.severity]}`}
                    >
                      {event.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sand-700">{event.category}</td>
                  <td className="px-4 py-3 font-mono text-xs text-sand-800">
                    {event.action}
                  </td>
                  <td className="px-4 py-3 text-sand-700">
                    {event.username ? `@${event.username}` : "—"}
                  </td>
                  <td className="max-w-md px-4 py-3 text-sand-800">
                    <p>{event.message}</p>
                    {event.metadata &&
                    typeof event.metadata === "object" &&
                    event.metadata !== null ? (
                      <pre className="mt-1 max-h-24 overflow-auto rounded bg-sand-100 p-2 text-xs text-sand-600">
                        {JSON.stringify(event.metadata, null, 2)}
                      </pre>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-sand-500">
                    {event.ipAddress ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex gap-2">
          {page > 1 ? (
            <Link
              href={pageHref(queryString, page - 1)}
              className="rounded-full border border-sand-300 px-4 py-2 text-sm text-sand-700 hover:bg-cream-100"
            >
              ← Previous
            </Link>
          ) : null}
          {page < totalPages ? (
            <Link
              href={pageHref(queryString, page + 1)}
              className="rounded-full border border-sand-300 px-4 py-2 text-sm text-sand-700 hover:bg-cream-100"
            >
              Next →
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
