import { LogFilters } from "@/components/admin/LogFilters";
import {
  ALL_LOG_TYPES,
  ALL_SEVERITIES,
  fetchSystemLogs,
  type LogSearchParams,
} from "@/lib/monitoring/query-logs";
import { LOG_SEVERITY_STYLES, LOG_TYPE_LABELS, formatLogMetadata } from "@/types/system-log";

export const metadata = {
  title: "System logs | Admin | FloraFoam",
};

type PageProps = {
  searchParams: Promise<LogSearchParams>;
};

export default async function AdminLogsPage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const { logs, total, parsed } = await fetchSystemLogs(rawParams);

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-2xl font-semibold text-sage-900">System log</h2>
        <p className="mt-1 text-sm text-sage-600">
          Internal audit trail for logins, profile changes, and checkout transactions.
        </p>
      </div>

      <LogFilters params={rawParams} types={ALL_LOG_TYPES} severities={ALL_SEVERITIES} />

      <p className="mt-6 text-sm text-sage-600">
        Showing {logs.length} of {total} matching events
        {parsed.limit < total ? ` (limited to ${parsed.limit})` : ""}
      </p>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-sage-200/80">
        <table className="min-w-full divide-y divide-sage-200 text-sm">
          <thead className="bg-sage-50/80">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-sage-700">Time</th>
              <th className="px-4 py-3 text-left font-medium text-sage-700">Type</th>
              <th className="px-4 py-3 text-left font-medium text-sage-700">Severity</th>
              <th className="px-4 py-3 text-left font-medium text-sage-700">User</th>
              <th className="px-4 py-3 text-left font-medium text-sage-700">Message</th>
              <th className="px-4 py-3 text-left font-medium text-sage-700">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sage-100 bg-cream-50">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sage-600">
                  No log entries match your filters.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="align-top hover:bg-white/60">
                  <td className="whitespace-nowrap px-4 py-3 text-sage-600">
                    {log.createdAt.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sage-800">{LOG_TYPE_LABELS[log.type]}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${LOG_SEVERITY_STYLES[log.severity]}`}
                    >
                      {log.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sage-700">
                    {log.username ? `@${log.username}` : "—"}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-sage-800">{log.message}</td>
                  <td className="max-w-xs px-4 py-3">
                    {log.metadata ? (
                      <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-sage-600">
                        {formatLogMetadata(log.metadata)}
                      </pre>
                    ) : (
                      <span className="text-sage-400">—</span>
                    )}
                    {(log.ipAddress || log.userAgent) && (
                      <p className="mt-1 text-xs text-sage-500">
                        {log.ipAddress && `IP: ${log.ipAddress}`}
                        {log.ipAddress && log.userAgent && " · "}
                        {log.userAgent &&
                          `UA: ${log.userAgent.length > 60 ? `${log.userAgent.slice(0, 60)}…` : log.userAgent}`}
                      </p>
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
