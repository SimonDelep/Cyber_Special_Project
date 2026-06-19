import { SystemLogsManager } from "@/components/admin/SystemLogsManager";

export const metadata = {
  title: "System logs | RoastRitual Admin",
};

export default function AdminLogsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl text-espresso">System logs</h2>
        <p className="mt-1 text-sm text-espresso/70">
          Monitor authentication, profile changes, checkout transactions, and
          admin actions across the application.
        </p>
      </div>
      <SystemLogsManager />
    </div>
  );
}
