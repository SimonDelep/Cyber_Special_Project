import { headers } from "next/headers";
import type { Prisma, SystemLogSeverity, SystemLogType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type LogEventInput = {
  type: SystemLogType;
  severity?: SystemLogSeverity;
  message: string;
  userId?: string | null;
  username?: string | null;
  metadata?: Record<string, unknown>;
};

export async function getRequestMeta(): Promise<{ ipAddress?: string; userAgent?: string }> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    return {
      ipAddress: forwarded?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? undefined,
      userAgent: h.get("user-agent") ?? undefined,
    };
  } catch {
    return {};
  }
}

/** Persists an audit event; never throws to callers. */
export async function logSystemEvent(
  input: LogEventInput,
  requestMeta?: { ipAddress?: string; userAgent?: string },
): Promise<void> {
  try {
    const meta = requestMeta ?? (await getRequestMeta());
    await prisma.systemLog.create({
      data: {
        type: input.type,
        severity: input.severity ?? "INFO",
        message: input.message,
        userId: input.userId ?? null,
        username: input.username ?? null,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
        ipAddress: meta.ipAddress ?? null,
        userAgent: meta.userAgent ?? null,
      },
    });
  } catch (error) {
    console.error("[SystemLog] Failed to write event:", error);
  }
}
