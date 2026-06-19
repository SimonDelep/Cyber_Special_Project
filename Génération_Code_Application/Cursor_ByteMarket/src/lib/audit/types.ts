import type { LogCategory, LogOutcome } from "@/db/schema";

export const AuditEvent = {
  AUTH_LOGIN_SUCCESS: "auth.login.success",
  AUTH_LOGIN_FAILURE: "auth.login.failure",
  AUTH_REGISTER_SUCCESS: "auth.register.success",
  AUTH_REGISTER_FAILURE: "auth.register.failure",
  AUTH_LOGOUT: "auth.logout",
  PROFILE_UPDATE_SUCCESS: "profile.update.success",
  PROFILE_UPDATE_FAILURE: "profile.update.failure",
  PROFILE_AVATAR_UPDATE: "profile.avatar.update",
  PROFILE_AVATAR_REMOVE: "profile.avatar.remove",
  PROFILE_DELETE_SUCCESS: "profile.delete.success",
  PROFILE_DELETE_FAILURE: "profile.delete.failure",
  TRANSACTION_CHECKOUT_REQUEST: "transaction.checkout.request",
  TRANSACTION_CHECKOUT_SUCCESS: "transaction.checkout.success",
  TRANSACTION_CHECKOUT_FAILURE: "transaction.checkout.failure",
  ADMIN_USER_CREATE: "admin.user.create",
  ADMIN_USER_UPDATE: "admin.user.update",
  ADMIN_USER_DELETE: "admin.user.delete",
  ADMIN_USER_ROLE: "admin.user.role",
  ADMIN_USER_BALANCE: "admin.user.balance",
  ADMIN_PRODUCT_CREATE: "admin.product.create",
  ADMIN_PRODUCT_UPDATE: "admin.product.update",
  ADMIN_PRODUCT_DELETE: "admin.product.delete",
} as const;

export type AuditEventType = (typeof AuditEvent)[keyof typeof AuditEvent];

export type LogEventInput = {
  eventType: AuditEventType | string;
  category: LogCategory;
  outcome: LogOutcome;
  message: string;
  actorUserId?: number | null;
  actorUsername?: string | null;
  targetUserId?: number | null;
  targetResource?: string | null;
  metadata?: Record<string, unknown>;
  request?: Request;
};

export type SystemLogRow = {
  id: number;
  eventType: string;
  category: LogCategory;
  outcome: LogOutcome;
  actorUserId: number | null;
  actorUsername: string | null;
  targetUserId: number | null;
  targetResource: string | null;
  message: string;
  metadata: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
};

export type SystemLogFilters = {
  category?: LogCategory;
  outcome?: LogOutcome;
  eventType?: string;
  limit?: number;
};
