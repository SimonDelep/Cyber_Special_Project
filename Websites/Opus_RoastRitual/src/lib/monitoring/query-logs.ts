import type { Prisma } from "@/generated/prisma/client";
import type {
  SystemLogCategory,
  SystemLogLevel,
} from "@/generated/prisma/enums";
import { db } from "@/lib/db";

export type SystemLogFilters = {
  q?: string;
  category?: SystemLogCategory;
  level?: SystemLogLevel;
  success?: boolean;
  page?: number;
  limit?: number;
};

export async function querySystemLogs(filters: SystemLogFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 50));
  const skip = (page - 1) * limit;

  const where: Prisma.SystemLogWhereInput = {};

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.level) {
    where.level = filters.level;
  }

  if (filters.success !== undefined) {
    where.success = filters.success;
  }

  if (filters.q?.trim()) {
    const term = filters.q.trim();
    where.OR = [
      { message: { contains: term, mode: "insensitive" } },
      { username: { contains: term, mode: "insensitive" } },
      { action: { contains: term, mode: "insensitive" } },
    ];
  }

  const [logs, total] = await Promise.all([
    db.systemLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        category: true,
        action: true,
        level: true,
        message: true,
        userId: true,
        username: true,
        ipAddress: true,
        userAgent: true,
        metadata: true,
        success: true,
        createdAt: true,
      },
    }),
    db.systemLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
