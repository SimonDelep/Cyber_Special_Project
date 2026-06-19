import { headers } from "next/headers";

import type { Prisma } from "@/generated/prisma/client";
import type {
  SystemLogCategory,
  SystemLogLevel,
} from "@/generated/prisma/enums";
import { db } from "@/lib/db";

export type LogEventInput = {
  category: SystemLogCategory;
  action: string;
  message: string;
  level?: SystemLogLevel;
  userId?: string | null;
  username?: string | null;
  request?: Request;
  metadata?: Record<string, unknown>;
  success?: boolean;
};

function extractRequestMeta(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ipAddress =
    forwarded?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null;

  return {
    ipAddress,
    userAgent: request.headers.get("user-agent"),
  };
}

async function resolveRequestMeta(request?: Request) {
  if (request) {
    return extractRequestMeta(request);
  }

  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    return {
      ipAddress:
        forwarded?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null,
      userAgent: h.get("user-agent"),
    };
  } catch {
    return { ipAddress: null, userAgent: null };
  }
}

function sanitizeMetadata(
  metadata?: Record<string, unknown>,
): Prisma.InputJsonValue | undefined {
  if (!metadata || Object.keys(metadata).length === 0) return undefined;

  const blocked = new Set([
    "password",
    "currentPassword",
    "newPassword",
    "confirmNewPassword",
    "passwordHash",
  ]);

  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (blocked.has(key)) continue;
    safe[key] = value;
  }

  return Object.keys(safe).length > 0
    ? (safe as Prisma.InputJsonValue)
    : undefined;
}

export async function logEvent(input: LogEventInput): Promise<void> {
  try {
    const { ipAddress, userAgent } = await resolveRequestMeta(input.request);

    await db.systemLog.create({
      data: {
        category: input.category,
        action: input.action,
        level: input.level ?? (input.success === false ? "WARN" : "INFO"),
        message: input.message,
        userId: input.userId ?? null,
        username: input.username ?? null,
        ipAddress,
        userAgent,
        metadata: sanitizeMetadata(input.metadata),
        success: input.success ?? true,
      },
    });
  } catch (error) {
    console.error("[system-log]", error);
  }
}
