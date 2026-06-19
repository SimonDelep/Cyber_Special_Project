import { requireAdmin } from "@/lib/auth";
import { queryDb } from "@/lib/db-query";
import { prisma } from "@/lib/prisma";
import { Alert } from "@/components/ui/Alert";

function formatDetails(details: unknown): string {
  if (details == null) return "—";
  if (typeof details === "string") return details;
  try {
    return JSON.stringify(details);
  } catch {
    return "—";
  }
}

function severityClass(severity: string): string {
  switch (severity) {
    case "ERROR":
      return "bg-red-500/20 text-red-300";
    case "WARN":
      return "bg-amber-500/20 text-amber-300";
    default:
      return "bg-zinc-700/50 text-zinc-300";
  }
}

export default async function AdminAuditPage() {
  await requireAdmin();

  const eventsResult = await queryDb(() =>
    prisma.auditEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    })
  );

  if (eventsResult.dbError || !eventsResult.data) {
    return (
      <div>
        <h2 className="text-xl font-semibold">Audit log</h2>
        <div className="mt-6">
          <Alert>{eventsResult.dbError ?? "Unable to load audit events."}</Alert>
        </div>
      </div>
    );
  }

  const events = eventsResult.data;

  return (
    <div>
      <h2 className="text-xl font-semibold">Audit log</h2>
      <p className="mt-2 text-sm text-zinc-500">
        Recent user and admin activity (last {events.length} events).
      </p>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-zinc-800">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Time</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Severity</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Resource</th>
              <th className="px-4 py-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-zinc-500"
                >
                  No audit events recorded yet.
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr
                  key={event.id}
                  className="border-b border-zinc-800/80 align-top"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-zinc-400">
                    {event.createdAt.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-cyan-400/90">
                    {event.action}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityClass(event.severity)}`}
                    >
                      {event.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {event.userEmail ? (
                      <div>
                        <div className="text-zinc-200">{event.userEmail}</div>
                        {event.userId && (
                          <div className="text-xs text-zinc-500 font-mono">
                            {event.userId}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-500">Anonymous</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {event.resourceType ? (
                      <div>
                        <div>{event.resourceType}</div>
                        {event.resourceId && (
                          <div className="text-xs font-mono text-zinc-500">
                            {event.resourceId}
                          </div>
                        )}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-xs break-all text-zinc-400 text-xs">
                    {formatDetails(event.details)}
                    {event.ipAddress && (
                      <div className="mt-1 text-zinc-600">
                        IP: {event.ipAddress}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
