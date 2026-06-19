import { AuditAction } from "@/lib/audit/actions";
import { logEvent } from "@/lib/audit/logger";
import { requireAdmin } from "@/lib/auth/admin";
import { toAdminUser } from "@/lib/admin/serializers";
import { balanceAdjustSchema, formatZodErrors } from "@/lib/admin/validation";
import { jsonError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { user: admin, error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const parsed = balanceAdjustSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(formatZodErrors(parsed.error));
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return jsonError("User not found", 404);

    const newBalance = target.balanceCents + parsed.data.adjustmentCents;
    if (newBalance < 0) {
      return jsonError("Balance cannot be negative", 400);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { balanceCents: newBalance },
    });

    await logEvent({
      category: "ADMIN",
      action: AuditAction.ADMIN_BALANCE_ADJUST,
      status: "SUCCESS",
      message: `Admin "${admin.username}" adjusted balance for "${target.username}"`,
      userId: admin.id,
      username: admin.username,
      request,
      metadata: {
        targetUserId: target.id,
        targetUsername: target.username,
        adjustmentCents: parsed.data.adjustmentCents,
        previousBalanceCents: target.balanceCents,
        newBalanceCents: newBalance,
      },
    });

    return jsonOk({ user: toAdminUser(updated) });
  } catch (err) {
    console.error("[admin/users/balance PATCH]", err);
    const message = err instanceof Error ? err.message : "Failed to adjust balance";
    return jsonError(message, 500);
  }
}
