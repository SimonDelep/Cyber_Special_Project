import type { LogCategory, LogLevel } from "@prisma/client";

export type LogEventInput = {
  level?: LogLevel;
  category: LogCategory;
  action: string;
  message: string;
  userId?: string | null;
  username?: string | null;
  metadata?: Record<string, unknown>;
  request?: Request;
};

export type SystemLogEntry = {
  id: string;
  level: LogLevel;
  category: LogCategory;
  action: string;
  message: string;
  userId: string | null;
  username: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};
