import type { SystemLogSeverity, SystemLogType } from "@prisma/client";

export const LOG_TYPE_LABELS: Record<SystemLogType, string> = {
  LOGIN_ATTEMPT: "Login attempt",
  LOGIN_SUCCESS: "Login success",
  LOGIN_FAILURE: "Login failure",
  LOGOUT: "Logout",
  PROFILE_UPDATE: "Profile update",
  PASSWORD_CHANGE: "Password change",
  ACCOUNT_DELETE: "Account delete",
  TRANSACTION_REQUEST: "Transaction request",
  TRANSACTION_SUCCESS: "Transaction success",
  TRANSACTION_FAILURE: "Transaction failure",
};

export const LOG_SEVERITY_STYLES: Record<SystemLogSeverity, string> = {
  INFO: "bg-sage-100 text-sage-800",
  WARNING: "bg-amber-100 text-amber-900",
  ERROR: "bg-red-100 text-red-800",
};

export function formatLogMetadata(metadata: unknown): string {
  if (metadata == null) return "—";
  try {
    return JSON.stringify(metadata, null, 2);
  } catch {
    return String(metadata);
  }
}
