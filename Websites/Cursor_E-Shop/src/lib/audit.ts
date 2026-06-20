import type { Prisma } from "@prisma/client";
import { isPrismaUnavailable } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export const AuditAction = {
  LOGIN_SUCCESS: "auth.login.success",
  LOGIN_FAILURE: "auth.login.failure",
  REGISTER_SUCCESS: "auth.register.success",
  REGISTER_FAILURE: "auth.register.failure",
  LOGOUT: "auth.logout",
  ORDER_PLACED: "order.placed",
  CART_ADD: "cart.add",
  CART_REMOVE: "cart.remove",
  ADMIN_USER_UPDATE: "admin.user.update",
  ADMIN_PRODUCT_CREATE: "admin.product.create",
  ADMIN_PRODUCT_UPDATE: "admin.product.update",
  ADMIN_PRODUCT_DELETE: "admin.product.delete",
  ADMIN_PRODUCT_IMPORT: "admin.product.import",
  PROFILE_AVATAR_UPDATE: "profile.avatar.update",
} as const;

export type AuditSeverity = "INFO" | "WARN" | "ERROR";

export type LogAuditEventInput = {
  action: string;
  severity?: AuditSeverity;
  userId?: string | null;
  userEmail?: string | null;
  ipAddress?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  details?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
};

/** Best-effort client IP from request headers (server actions / route handlers). */
export async function getAuditRequestMeta(): Promise<{ ipAddress?: string }> {
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    const ip =
      forwarded?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? undefined;
    return { ipAddress: ip };
  } catch {
    return {};
  }
}

/** Persist an audit event; never throws — failures are logged and ignored. */
export async function logAuditEvent(input: LogAuditEventInput): Promise<void> {
  try {
    await prisma.auditEvent.create({
      data: {
        action: input.action,
        severity: input.severity ?? "INFO",
        userId: input.userId ?? null,
        userEmail: input.userEmail ?? null,
        ipAddress: input.ipAddress ?? null,
        resourceType: input.resourceType ?? null,
        resourceId: input.resourceId ?? null,
        details: input.details ?? undefined,
        metadata: input.metadata ?? undefined,
      },
    });
  } catch (err) {
    if (isPrismaUnavailable(err)) {
      console.warn(
        "[audit] Database unavailable, event not logged:",
        input.action
      );
      return;
    }
    console.warn("[audit] Failed to log event:", input.action, err);
  }
}

export async function logAuditEventWithRequest(
  input: Omit<LogAuditEventInput, "ipAddress">
): Promise<void> {
  const { ipAddress } = await getAuditRequestMeta();
  await logAuditEvent({ ...input, ipAddress });
}
