import { db } from '@/db';
import { systemLogs, type LogSeverity, type SystemLog } from '@/db/schema';
import type { EventTypeValue } from '@/lib/monitoring/events';
import { and, count, desc, eq, gte, like, or } from 'drizzle-orm';

export interface LogEventInput {
  eventType: EventTypeValue | string;
  severity: LogSeverity;
  message: string;
  userId?: number | null;
  username?: string | null;
  request?: Request;
  metadata?: Record<string, unknown>;
}

export interface LogFilters {
  eventType?: string;
  severity?: LogSeverity;
  username?: string;
  limit?: number;
  offset?: number;
}

export interface LogStats {
  total: number;
  last24h: number;
  failedLogins24h: number;
  checkouts24h: number;
  profileChanges24h: number;
}

export function getClientIp(request?: Request): string | null {
  if (!request) return null;
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? null;
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return null;
}

export async function logEvent(input: LogEventInput): Promise<void> {
  try {
    await db.insert(systemLogs).values({
      eventType: input.eventType,
      severity: input.severity,
      message: input.message,
      userId: input.userId ?? null,
      username: input.username ?? null,
      ipAddress: getClientIp(input.request),
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[monitoring] Failed to write system log:', err);
  }
}

export async function getSystemLogs(filters: LogFilters = {}): Promise<SystemLog[]> {
  const conditions = [];

  if (filters.eventType) {
    conditions.push(eq(systemLogs.eventType, filters.eventType));
  }
  if (filters.severity) {
    conditions.push(eq(systemLogs.severity, filters.severity));
  }
  if (filters.username?.trim()) {
    const term = `%${filters.username.trim()}%`;
    conditions.push(
      or(like(systemLogs.username, term), like(systemLogs.message, term))
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const limit = Math.min(filters.limit ?? 100, 500);
  const offset = filters.offset ?? 0;

  let query = db.select().from(systemLogs).$dynamic();
  if (whereClause) query = query.where(whereClause);

  return query.orderBy(desc(systemLogs.createdAt)).limit(limit).offset(offset);
}

export async function getLogStats(): Promise<LogStats> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [totalRow] = await db.select({ value: count() }).from(systemLogs);
  const [last24hRow] = await db
    .select({ value: count() })
    .from(systemLogs)
    .where(gte(systemLogs.createdAt, since24h));
  const [failedLoginsRow] = await db
    .select({ value: count() })
    .from(systemLogs)
    .where(
      and(
        eq(systemLogs.eventType, 'auth.login.failed'),
        gte(systemLogs.createdAt, since24h)
      )
    );
  const [checkoutsRow] = await db
    .select({ value: count() })
    .from(systemLogs)
    .where(
      and(
        or(
          eq(systemLogs.eventType, 'transaction.checkout.success'),
          eq(systemLogs.eventType, 'transaction.checkout.failed')
        ),
        gte(systemLogs.createdAt, since24h)
      )
    );
  const [profileRow] = await db
    .select({ value: count() })
    .from(systemLogs)
    .where(
      and(
        or(
          eq(systemLogs.eventType, 'profile.update'),
          eq(systemLogs.eventType, 'profile.delete')
        ),
        gte(systemLogs.createdAt, since24h)
      )
    );

  return {
    total: totalRow?.value ?? 0,
    last24h: last24hRow?.value ?? 0,
    failedLogins24h: failedLoginsRow?.value ?? 0,
    checkouts24h: checkoutsRow?.value ?? 0,
    profileChanges24h: profileRow?.value ?? 0,
  };
}

export function parseLogMetadata(log: SystemLog): Record<string, unknown> | null {
  if (!log.metadata) return null;
  try {
    return JSON.parse(log.metadata) as Record<string, unknown>;
  } catch {
    return null;
  }
}
