import type { LogCategory, LogStatus, Prisma } from "../../../../../generated/prisma/client";
import { requireAdmin } from "@/lib/auth/admin";
import { toAdminSystemLogs } from "@/lib/audit/serializers";
import { jsonError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 50;

const VALID_CATEGORIES: LogCategory[] = ["AUTH", "PROFILE", "TRANSACTION", "ADMIN"];
const VALID_STATUSES: LogStatus[] = ["SUCCESS", "FAILURE", "INFO"];

export async function GET(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as LogCategory | null;
    const status = searchParams.get("status") as LogStatus | null;
    const action = searchParams.get("action")?.trim();
    const q = searchParams.get("q")?.trim();
    const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);

    const where: Prisma.SystemLogWhereInput = {};

    if (category && VALID_CATEGORIES.includes(category)) {
      where.category = category;
    }
    if (status && VALID_STATUSES.includes(status)) {
      where.status = status;
    }
    if (action) {
      where.action = { contains: action, mode: "insensitive" };
    }
    if (q) {
      where.OR = [
        { message: { contains: q, mode: "insensitive" } },
        { username: { contains: q, mode: "insensitive" } },
        { action: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.systemLog.count({ where }),
      prisma.systemLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
    ]);

    return jsonOk({
      logs: toAdminSystemLogs(logs),
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      },
    });
  } catch (err) {
    console.error("[admin/logs GET]", err);
    return jsonError("Failed to load system logs", 500);
  }
}
