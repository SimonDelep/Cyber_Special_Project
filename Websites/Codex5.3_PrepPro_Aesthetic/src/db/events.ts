import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "./client";
import { systemEvents } from "./schema";
import type { LogEventInput, SystemEventView } from "@/lib/monitoring/types";
import { eventStatuses, eventTypes } from "@/lib/monitoring/types";

export type EventListFilters = {
  eventType?: string;
  status?: string;
  userId?: number;
  limit?: number;
  offset?: number;
};

function toView(row: typeof systemEvents.$inferSelect): SystemEventView {
  let metadata: Record<string, unknown> | null = null;
  if (row.metadata) {
    try {
      metadata = JSON.parse(row.metadata) as Record<string, unknown>;
    } catch {
      metadata = null;
    }
  }

  return {
    id: row.id,
    eventType: row.eventType as SystemEventView["eventType"],
    status: row.status as SystemEventView["status"],
    userId: row.userId,
    actorLabel: row.actorLabel,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    message: row.message,
    metadata,
    createdAt: row.createdAt,
  };
}

export function recordSystemEvent(input: LogEventInput): void {
  const db = getDb();
  const metadata =
    input.metadata && Object.keys(input.metadata).length > 0
      ? JSON.stringify(input.metadata)
      : null;

  db.insert(systemEvents)
    .values({
      eventType: input.eventType,
      status: input.status,
      userId: input.userId ?? null,
      actorLabel: input.actorLabel ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      message: input.message,
      metadata,
    })
    .run();
}

export function listSystemEvents(
  filters: EventListFilters = {},
): { events: SystemEventView[]; total: number } {
  const db = getDb();
  const limit = Math.min(Math.max(filters.limit ?? 50, 1), 200);
  const offset = Math.max(filters.offset ?? 0, 0);

  const conditions = [];

  if (filters.eventType && eventTypes.includes(filters.eventType as never)) {
    conditions.push(eq(systemEvents.eventType, filters.eventType));
  }

  if (filters.status && eventStatuses.includes(filters.status as never)) {
    conditions.push(eq(systemEvents.status, filters.status));
  }

  if (filters.userId && filters.userId > 0) {
    conditions.push(eq(systemEvents.userId, filters.userId));
  }

  const whereClause =
    conditions.length > 0 ? and(...conditions) : undefined;

  const totalRow = db
    .select({ count: sql<number>`count(*)` })
    .from(systemEvents)
    .where(whereClause)
    .all()[0];

  const rows = db
    .select()
    .from(systemEvents)
    .where(whereClause)
    .orderBy(desc(systemEvents.createdAt))
    .limit(limit)
    .offset(offset)
    .all();

  return {
    events: rows.map(toView),
    total: Number(totalRow?.count ?? 0),
  };
}

export function countRecentFailures(sinceIso: string): number {
  const db = getDb();
  const row = db
    .select({ count: sql<number>`count(*)` })
    .from(systemEvents)
    .where(
      and(
        eq(systemEvents.status, "failure"),
        sql`${systemEvents.createdAt} >= ${sinceIso}`,
      ),
    )
    .all()[0];
  return Number(row?.count ?? 0);
}
