import type { Prisma, SystemLogSeverity, SystemLogType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type LogSearchParams = {
  type?: string;
  severity?: string;
  q?: string;
  limit?: string;
};

export const ALL_LOG_TYPES: SystemLogType[] = [
  "LOGIN_ATTEMPT",
  "LOGIN_SUCCESS",
  "LOGIN_FAILURE",
  "LOGOUT",
  "PROFILE_UPDATE",
  "PASSWORD_CHANGE",
  "ACCOUNT_DELETE",
  "TRANSACTION_REQUEST",
  "TRANSACTION_SUCCESS",
  "TRANSACTION_FAILURE",
];

export const ALL_SEVERITIES: SystemLogSeverity[] = ["INFO", "WARNING", "ERROR"];

export function parseLogParams(params: LogSearchParams) {
  const type =
    params.type && params.type !== "all" && ALL_LOG_TYPES.includes(params.type as SystemLogType)
      ? (params.type as SystemLogType)
      : undefined;
  const severity =
    params.severity &&
    params.severity !== "all" &&
    ALL_SEVERITIES.includes(params.severity as SystemLogSeverity)
      ? (params.severity as SystemLogSeverity)
      : undefined;
  const q = params.q?.trim() ?? "";
  const limit = Math.min(Math.max(Number(params.limit) || 100, 10), 500);

  return { type, severity, q, limit };
}

export function buildLogWhere(params: ReturnType<typeof parseLogParams>): Prisma.SystemLogWhereInput {
  const where: Prisma.SystemLogWhereInput = {};

  if (params.type) where.type = params.type;
  if (params.severity) where.severity = params.severity;

  if (params.q) {
    where.OR = [
      { message: { contains: params.q, mode: "insensitive" } },
      { username: { contains: params.q, mode: "insensitive" } },
    ];
  }

  return where;
}

export async function fetchSystemLogs(params: LogSearchParams) {
  const parsed = parseLogParams(params);
  const where = buildLogWhere(parsed);

  const [logs, total] = await Promise.all([
    prisma.systemLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: parsed.limit,
    }),
    prisma.systemLog.count({ where }),
  ]);

  return { logs, total, parsed };
}
