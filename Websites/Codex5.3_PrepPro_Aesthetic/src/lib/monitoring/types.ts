export const eventStatuses = ["success", "failure", "info"] as const;
export type EventStatus = (typeof eventStatuses)[number];

export const eventTypes = [
  "auth.login.success",
  "auth.login.failure",
  "auth.register.success",
  "auth.register.failure",
  "auth.logout",
  "profile.update",
  "profile.delete",
  "transaction.checkout.success",
  "transaction.checkout.failure",
  "admin.user.update",
  "admin.user.delete",
  "admin.products.import",
] as const;

export type EventType = (typeof eventTypes)[number];

export type LogEventInput = {
  eventType: EventType;
  status: EventStatus;
  message: string;
  userId?: number | null;
  actorLabel?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
};

export type SystemEventView = {
  id: number;
  eventType: EventType;
  status: EventStatus;
  userId: number | null;
  actorLabel: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  message: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};
