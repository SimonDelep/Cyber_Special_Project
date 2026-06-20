import type { LogCategory, LogStatus, Prisma } from "../../../generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getRequestContext } from "@/lib/audit/request-context";

export type LogEventInput = {
  category: LogCategory;
  action: string;
  status: LogStatus;
  message: string;
  userId?: string | null;
  username?: string | null;
  request?: Request;
  metadata?: Prisma.InputJsonValue;
};

/** Persists an audit entry; failures are swallowed so logging never breaks app flows. */
export async function logEvent(input: LogEventInput): Promise<void> {
  try {
    const ctx = input.request ? getRequestContext(input.request) : null;

    await prisma.systemLog.create({
      data: {
        category: input.category,
        action: input.action,
        status: input.status,
        message: input.message,
        userId: input.userId ?? null,
        username: input.username ?? null,
        ipAddress: ctx?.ipAddress ?? null,
        userAgent: ctx?.userAgent ?? null,
        metadata: input.metadata ?? undefined,
      },
    });
  } catch (err) {
    console.error("[audit logEvent]", err);
  }
}
