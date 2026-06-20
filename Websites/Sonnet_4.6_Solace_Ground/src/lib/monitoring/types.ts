import type { LogCategory, LogSeverity, LogStatus } from '@/db/schema';

export type LogEventInput = {
  action: string;
  category: LogCategory;
  message: string;
  status: LogStatus;
  severity?: LogSeverity;
  userId?: number | null;
  username?: string | null;
  request?: Request;
  metadata?: Record<string, unknown>;
};

export type PublicSystemLog = {
  id: number;
  createdAt: string;
  action: string;
  category: LogCategory;
  severity: LogSeverity;
  status: LogStatus;
  message: string;
  userId: number | null;
  username: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
};

export const LOG_ACTIONS = {
  AUTH_LOGIN_SUCCESS: 'auth.login.success',
  AUTH_LOGIN_FAILED: 'auth.login.failed',
  AUTH_REGISTER_SUCCESS: 'auth.register.success',
  AUTH_REGISTER_FAILED: 'auth.register.failed',
  AUTH_LOGOUT: 'auth.logout',
  PROFILE_UPDATE: 'profile.update',
  PROFILE_DELETE: 'profile.delete',
  PROFILE_AVATAR_UPLOAD: 'profile.avatar.upload',
  TRANSACTION_CHECKOUT_SUCCESS: 'transaction.checkout.success',
  TRANSACTION_CHECKOUT_FAILED: 'transaction.checkout.failed',
  TRANSACTION_CHECKOUT_INSUFFICIENT: 'transaction.checkout.insufficient_balance',
  ADMIN_USER_UPDATE: 'admin.user.update',
  ADMIN_USER_DELETE: 'admin.user.delete',
  ADMIN_PRODUCT_CREATE: 'admin.product.create',
  ADMIN_PRODUCT_IMPORT: 'admin.product.import',
  ADMIN_PRODUCT_UPDATE: 'admin.product.update',
  ADMIN_PRODUCT_DELETE: 'admin.product.delete',
  REVIEW_SUBMIT: 'review.submit',
  REVIEW_DELETE: 'review.delete',
} as const;
