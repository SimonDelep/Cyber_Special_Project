import { and, count, desc, eq, like } from "drizzle-orm";
import { getDb } from "@/db/client";
import { systemLogs } from "@/db/schema";
import type { LogCategory, LogOutcome } from "@/db/schema";
import type { SystemLogFilters, SystemLogRow } from "@/lib/audit/types";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

export function listSystemLogs(filters: SystemLogFilters = {}): SystemLogRow[] {
  const db = getDb();
  const conditions = [];

  if (filters.category) {
    conditions.push(eq(systemLogs.category, filters.category));
  }
  if (filters.outcome) {
    conditions.push(eq(systemLogs.outcome, filters.outcome));
  }
  if (filters.eventType?.trim()) {
    conditions.push(like(systemLogs.eventType, `${filters.eventType.trim()}%`));
  }

  const limit = Math.min(
    Math.max(filters.limit ?? DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select()
    .from(systemLogs)
    .where(whereClause)
    .orderBy(desc(systemLogs.createdAt))
    .limit(limit)
    .all() as SystemLogRow[];
}

export function countSystemLogs(): number {
  const db = getDb();
  const [row] = db.select({ total: count() }).from(systemLogs).all();
  return Number(row?.total ?? 0);
}

export function parseLogCategory(value: string | null): LogCategory | undefined {
  if (value === "auth" || value === "profile" || value === "transaction" || value === "admin") {
    return value;
  }
  return undefined;
}

export function parseLogOutcome(value: string | null): LogOutcome | undefined {
  if (value === "success" || value === "failure" || value === "info") {
    return value;
  }
  return undefined;
}

export function formatLogTimestamp(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date);
}

export function outcomeBadgeClass(outcome: LogOutcome): string {
  switch (outcome) {
    case "success":
      return "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30";
    case "failure":
      return "bg-red-500/15 text-red-300 ring-red-500/30";
    default:
      return "bg-surface-muted/80 text-ink-muted ring-border";
  }
}

export function categoryLabel(category: LogCategory): string {
  const labels: Record<LogCategory, string> = {
    auth: "Authentication",
    profile: "Profile",
    transaction: "Transaction",
    admin: "Administration",
  };
  return labels[category];
}
