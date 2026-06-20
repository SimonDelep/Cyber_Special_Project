import { prisma } from "@/lib/prisma";
import { LogLevel, Prisma } from "@prisma/client";
import type { LogEventInput } from "@/lib/logging/types";

function getRequestMeta(request?: Request) {
  if (!request) return { ipAddress: null, userAgent: null };

  const forwarded = request.headers.get("x-forwarded-for");
  const ipAddress =
    forwarded?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null;
  const userAgent = request.headers.get("user-agent") ?? null;

  return { ipAddress, userAgent };
}

export async function logEvent(input: LogEventInput): Promise<void> {
  try {
    const { ipAddress, userAgent } = getRequestMeta(input.request);

    await prisma.systemLog.create({
      data: {
        level: input.level ?? LogLevel.INFO,
        category: input.category,
        action: input.action,
        message: input.message,
        userId: input.userId ?? null,
        username: input.username ?? null,
        metadata: input.metadata
          ? (input.metadata as Prisma.InputJsonValue)
          : undefined,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error("[SystemLog] Failed to write event:", error);
  }
}
