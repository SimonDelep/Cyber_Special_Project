import {
  EventCategory,
  EventStatus,
  type Prisma,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export { EventCategory, EventStatus };

export type LogEventInput = {
  category: EventCategory;
  action: string;
  status: EventStatus;
  message: string;
  userId?: string | null;
  username?: string | null;
  metadata?: Prisma.InputJsonValue;
  request?: Request;
};

function getRequestContext(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ipAddress =
    forwarded?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null;
  const userAgent = request.headers.get("user-agent");

  return { ipAddress, userAgent };
}

export async function logEvent(input: LogEventInput): Promise<void> {
  try {
    const { ipAddress, userAgent } = input.request
      ? getRequestContext(input.request)
      : { ipAddress: null, userAgent: null };

    await prisma.systemLog.create({
      data: {
        category: input.category,
        action: input.action,
        status: input.status,
        message: input.message,
        userId: input.userId ?? null,
        username: input.username ?? null,
        metadata: input.metadata ?? undefined,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error("Failed to write system log:", error);
  }
}
