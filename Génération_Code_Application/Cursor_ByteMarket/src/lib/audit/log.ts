import { getDb } from "@/db/client";
import { systemLogs } from "@/db/schema";
import type { LogEventInput } from "@/lib/audit/types";
import { getClientIp, getUserAgent } from "@/lib/audit/request";

const MAX_METADATA_BYTES = 4096;

function serializeMetadata(data?: Record<string, unknown>): string | null {
  if (!data || Object.keys(data).length === 0) return null;
  try {
    let json = JSON.stringify(data);
    if (json.length > MAX_METADATA_BYTES) {
      json = json.slice(0, MAX_METADATA_BYTES) + "…";
    }
    return json;
  } catch {
    return null;
  }
}

/** Persists an internal audit event. Never throws — failures are swallowed. */
export function logSystemEvent(input: LogEventInput): void {
  try {
    const db = getDb();
    db.insert(systemLogs)
      .values({
        eventType: input.eventType,
        category: input.category,
        outcome: input.outcome,
        actorUserId: input.actorUserId ?? null,
        actorUsername: input.actorUsername?.trim() || null,
        targetUserId: input.targetUserId ?? null,
        targetResource: input.targetResource?.trim() || null,
        message: input.message.slice(0, 2000),
        metadata: serializeMetadata(input.metadata),
        ipAddress: getClientIp(input.request),
        userAgent: getUserAgent(input.request),
        createdAt: new Date(),
      })
      .run();
  } catch (err) {
    console.error("[audit] Failed to write system log:", err);
  }
}
