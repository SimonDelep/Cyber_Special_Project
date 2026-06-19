import { getDb } from '@/db';
import { systemLogs } from '@/db/schema';
import type { LogEventInput, PublicSystemLog } from './types';
import type { SystemLog } from '@/db/schema';

function getClientIp(request?: Request): string | null {
  if (!request) return null;
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? null;
  return request.headers.get('x-real-ip');
}

function getUserAgent(request?: Request): string | null {
  return request?.headers.get('user-agent') ?? null;
}

export function logEvent(input: LogEventInput): void {
  try {
    const db = getDb();
    const metadata =
      input.metadata && Object.keys(input.metadata).length > 0
        ? JSON.stringify(input.metadata)
        : null;

    db.insert(systemLogs)
      .values({
        action: input.action,
        category: input.category,
        severity: input.severity ?? (input.status === 'failure' ? 'warning' : 'info'),
        status: input.status,
        message: input.message,
        userId: input.userId ?? null,
        username: input.username ?? null,
        ipAddress: getClientIp(input.request),
        userAgent: getUserAgent(input.request),
        metadata,
        createdAt: new Date().toISOString(),
      })
      .run();
  } catch (err) {
    console.error('[system-log] Failed to write event:', err);
  }
}

export function toPublicSystemLog(row: SystemLog): PublicSystemLog {
  let metadata: Record<string, unknown> | null = null;
  if (row.metadata) {
    try {
      metadata = JSON.parse(row.metadata) as Record<string, unknown>;
    } catch {
      metadata = { raw: row.metadata };
    }
  }

  return {
    id: row.id,
    createdAt: row.createdAt,
    action: row.action,
    category: row.category,
    severity: row.severity,
    status: row.status,
    message: row.message,
    userId: row.userId,
    username: row.username,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    metadata,
  };
}
