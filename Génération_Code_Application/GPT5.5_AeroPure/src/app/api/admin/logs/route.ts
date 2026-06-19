import { prisma } from "@/lib/prisma";
import { LogCategory, LogLevel, Prisma } from "@prisma/client";
import { requireAdminApi } from "@/lib/auth/admin-guard";
import { jsonSuccess } from "@/lib/auth/api";

export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const level = searchParams.get("level");
  const q = searchParams.get("q")?.trim();
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "100", 10), 500);

  const where: Prisma.SystemLogWhereInput = {};

  if (
    category &&
    Object.values(LogCategory).includes(category as LogCategory)
  ) {
    where.category = category as LogCategory;
  }

  if (level && Object.values(LogLevel).includes(level as LogLevel)) {
    where.level = level as LogLevel;
  }

  if (q) {
    where.OR = [
      { message: { contains: q, mode: "insensitive" } },
      { action: { contains: q, mode: "insensitive" } },
      { username: { contains: q, mode: "insensitive" } },
    ];
  }

  const logs = await prisma.systemLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return jsonSuccess({
    logs: logs.map((log) => ({
      id: log.id,
      level: log.level,
      category: log.category,
      action: log.action,
      message: log.message,
      userId: log.userId,
      username: log.username,
      metadata: log.metadata as Record<string, unknown> | null,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt.toISOString(),
    })),
    count: logs.length,
  });
}
