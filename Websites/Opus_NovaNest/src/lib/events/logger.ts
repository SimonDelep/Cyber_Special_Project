import { insertSystemEvent } from '../db/system-events';
import type { EventAction, EventCategory, EventOutcome } from './constants';
import { getRequestContext } from './request';

export type LogEventInput = {
  category: EventCategory;
  action: EventAction | string;
  outcome: EventOutcome;
  message: string;
  userId?: number | null;
  username?: string | null;
  request?: Request;
  metadata?: Record<string, unknown>;
};

/** Append an internal system log entry. Never throws. */
export function logEvent(input: LogEventInput): void {
  try {
    const ctx = getRequestContext(input.request);
    insertSystemEvent({
      category: input.category,
      action: input.action,
      outcome: input.outcome,
      message: input.message,
      userId: input.userId ?? null,
      username: input.username ?? null,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      requestPath: ctx.path,
      requestMethod: ctx.method,
      metadata: input.metadata ?? null,
    });
  } catch (err) {
    console.error('[system-log] Failed to write event:', err);
  }
}
