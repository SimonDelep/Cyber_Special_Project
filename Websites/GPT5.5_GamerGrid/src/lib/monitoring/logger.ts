import { and, desc, eq, like, or, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getDb } from '@/db';
import { systemEvents } from '@/db/schema';
import { getRequestMeta } from '@/lib/monitoring/request';
import type { ListEventsQuery, LogEventInput, SystemEventDTO } from '@/lib/monitoring/types';

function parseMetadata(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function toDto(row: typeof systemEvents.$inferSelect): SystemEventDTO {
  return {
    id: row.id,
    category: row.category,
    action: row.action,
    severity: row.severity,
    status: row.status,
    userId: row.userId,
    username: row.username,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    message: row.message,
    metadata: parseMetadata(row.metadata),
    createdAt: row.createdAt.toISOString(),
  };
}

/** Persists an audit event; never throws to callers. */
export async function logEvent(input: LogEventInput): Promise<void> {
  try {
    const db = getDb();
    const { ipAddress, userAgent } = getRequestMeta(input.request);
    const metadata =
      input.metadata && Object.keys(input.metadata).length > 0
        ? JSON.stringify(input.metadata)
        : null;

    await db.insert(systemEvents).values({
      id: nanoid(16),
      category: input.category,
      action: input.action,
      severity: input.severity,
      status: input.status,
      userId: input.userId ?? null,
      username: input.username ?? null,
      ipAddress,
      userAgent,
      message: input.message.slice(0, 2000),
      metadata,
      createdAt: new Date(),
    });
  } catch {
    // Monitoring must not break primary flows
  }
}

export async function listSystemEvents(
  query: ListEventsQuery = {},
): Promise<{ events: SystemEventDTO[]; total: number }> {
  const db = getDb();
  const limit = Math.min(Math.max(query.limit ?? 50, 1), 200);
  const offset = Math.max(query.offset ?? 0, 0);

  const conditions = [];

  if (query.category) {
    conditions.push(eq(systemEvents.category, query.category));
  }
  if (query.severity) {
    conditions.push(eq(systemEvents.severity, query.severity));
  }
  if (query.status) {
    conditions.push(eq(systemEvents.status, query.status));
  }
  if (query.action?.trim()) {
    conditions.push(eq(systemEvents.action, query.action.trim()));
  }
  if (query.search?.trim()) {
    const term = `%${query.search.trim()}%`;
    conditions.push(
      or(
        like(systemEvents.message, term),
        like(systemEvents.username, term),
        like(systemEvents.action, term),
      )!,
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(systemEvents)
    .where(whereClause);

  const rows = await db
    .select()
    .from(systemEvents)
    .where(whereClause)
    .orderBy(desc(systemEvents.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    events: rows.map(toDto),
    total: Number(countRow?.count ?? 0),
  };
}
