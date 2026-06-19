export const eventCategories = ['auth', 'profile', 'transaction', 'admin'] as const;
export type EventCategory = (typeof eventCategories)[number];

export const eventSeverities = ['info', 'warning', 'error'] as const;
export type EventSeverity = (typeof eventSeverities)[number];

export const eventStatuses = ['success', 'failure'] as const;
export type EventStatus = (typeof eventStatuses)[number];

export const EventAction = {
  LOGIN_SUCCESS: 'auth.login.success',
  LOGIN_FAILURE: 'auth.login.failure',
  REGISTER_SUCCESS: 'auth.register.success',
  REGISTER_FAILURE: 'auth.register.failure',
  LOGOUT: 'auth.logout',
  PROFILE_UPDATE: 'profile.update',
  PROFILE_AVATAR: 'profile.avatar.upload',
  PROFILE_DELETE: 'profile.account.delete',
  CHECKOUT_SUCCESS: 'transaction.checkout.success',
  CHECKOUT_FAILURE: 'transaction.checkout.failure',
  ADMIN_USER_UPDATE: 'admin.user.update',
  ADMIN_USER_DELETE: 'admin.user.delete',
} as const;

export type SystemEventDTO = {
  id: string;
  category: EventCategory;
  action: string;
  severity: EventSeverity;
  status: EventStatus;
  userId: string | null;
  username: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  message: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type LogEventInput = {
  category: EventCategory;
  action: string;
  severity: EventSeverity;
  status: EventStatus;
  message: string;
  userId?: string | null;
  username?: string | null;
  metadata?: Record<string, unknown>;
  request?: Request;
};

export type ListEventsQuery = {
  category?: EventCategory;
  severity?: EventSeverity;
  status?: EventStatus;
  action?: string;
  search?: string;
  limit?: number;
  offset?: number;
};
