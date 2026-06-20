"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export type EventSeverity = "INFO" | "WARN" | "ERROR";

export async function logEvent(input: {
  type: string;
  message: string;
  severity?: EventSeverity;
  userId?: string | null;
  metadata?: unknown;
}) {
  const h = await headers();
  const userAgent = h.get("user-agent") ?? undefined;
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    undefined;

  try {
    await prisma.eventLog.create({
      data: {
        type: input.type,
        message: input.message,
        severity: input.severity ?? "INFO",
        userId: input.userId ?? null,
        ip,
        userAgent,
        metadata: input.metadata as any,
      },
    });
  } catch {
    // Logging must never break the app.
  }
}

