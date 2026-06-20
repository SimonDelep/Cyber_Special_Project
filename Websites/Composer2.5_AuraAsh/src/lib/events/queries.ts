import type { EventCategory, EventStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { SystemLogItem } from "@/types/admin";

export type LogFilters = {
  category?: EventCategory | "ALL";
  status?: EventStatus | "ALL";
  search?: string;
  limit?: number;
  offset?: number;
};

function serializeLog(log: {
  id: string;
  category: EventCategory;
  action: string;
  status: EventStatus;
  message: string;
  userId: string | null;
  username: string | null;
  metadata: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}): SystemLogItem {
  return {
    id: log.id,
    category: log.category,
    action: log.action,
    status: log.status,
    message: log.message,
    userId: log.userId,
    username: log.username,
    metadata: log.metadata,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    createdAt: log.createdAt.toISOString(),
  };
}

export async function getSystemLogs(filters: LogFilters = {}) {
  const limit = Math.min(filters.limit ?? 50, 200);
  const offset = filters.offset ?? 0;
  const search = filters.search?.trim();

  const where = {
    ...(filters.category && filters.category !== "ALL"
      ? { category: filters.category }
      : {}),
    ...(filters.status && filters.status !== "ALL"
      ? { status: filters.status }
      : {}),
    ...(search
      ? {
          OR: [
            { message: { contains: search, mode: "insensitive" as const } },
            { action: { contains: search, mode: "insensitive" as const } },
            { username: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.systemLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.systemLog.count({ where }),
  ]);

  return {
    logs: logs.map(serializeLog),
    total,
    limit,
    offset,
  };
}

export async function getLogStats() {
  const [total, last24h, failures] = await Promise.all([
    prisma.systemLog.count(),
    prisma.systemLog.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.systemLog.count({ where: { status: "FAILURE" } }),
  ]);

  return { total, last24h, failures };
}
