import type { SystemLog } from "../../../generated/prisma/client";

export type AdminSystemLog = {
  id: string;
  category: SystemLog["category"];
  action: string;
  status: SystemLog["status"];
  message: string;
  userId: string | null;
  username: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: unknown;
  createdAt: string;
};

export function toAdminSystemLog(log: SystemLog): AdminSystemLog {
  return {
    id: log.id,
    category: log.category,
    action: log.action,
    status: log.status,
    message: log.message,
    userId: log.userId,
    username: log.username,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    metadata: log.metadata,
    createdAt: log.createdAt.toISOString(),
  };
}

export function toAdminSystemLogs(logs: SystemLog[]): AdminSystemLog[] {
  return logs.map(toAdminSystemLog);
}
