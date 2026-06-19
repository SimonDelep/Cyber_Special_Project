import type {
  EventCategory,
  EventSeverity,
  Prisma,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type LogEventInput = {
  category: EventCategory;
  action: string;
  message: string;
  severity?: EventSeverity;
  userId?: string | null;
  username?: string | null;
  metadata?: Prisma.InputJsonValue;
  request?: Request | null;
};

export function getRequestContext(request?: Request | null) {
  if (!request) return { ipAddress: null, userAgent: null };

  const forwarded = request.headers.get("x-forwarded-for");
  const ipAddress =
    forwarded?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null;
  const userAgent = request.headers.get("user-agent");

  return {
    ipAddress,
    userAgent: userAgent ? userAgent.slice(0, 512) : null,
  };
}

/** Writes an internal system event. Never throws — failures are logged to stderr only. */
export async function logEvent(input: LogEventInput): Promise<void> {
  try {
    const { ipAddress, userAgent } = getRequestContext(input.request);

    await prisma.systemEvent.create({
      data: {
        category: input.category,
        action: input.action,
        severity: input.severity ?? "INFO",
        message: input.message.slice(0, 2000),
        userId: input.userId ?? null,
        username: input.username ?? null,
        metadata: input.metadata ?? undefined,
        ipAddress,
        userAgent,
      },
    });
  } catch (err) {
    console.error("[system-event]", input.action, err);
  }
}
