import { prisma } from "@/lib/prisma";
import { LogCategory, LogLevel } from "@prisma/client";
import { requireAdminApi } from "@/lib/auth/admin-guard";
import { balanceAdjustSchema } from "@/lib/admin/validation";
import { jsonError, jsonSuccess } from "@/lib/auth/api";
import { logEvent } from "@/lib/logging/logger";
import { LOG_ACTIONS } from "@/lib/logging/actions";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireAdminApi();
  if ("response" in auth) return auth.response;

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = balanceAdjustSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid input";
      return jsonError(message, 400);
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return jsonError("User not found", 404);

    const newBalance = Number(user.balance) + parsed.data.adjustment;
    if (newBalance < 0) {
      return jsonError("Balance cannot be negative", 400);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { balance: newBalance },
      select: { id: true, username: true, balance: true },
    });

    await logEvent({
      level: LogLevel.INFO,
      category: LogCategory.ADMIN,
      action: LOG_ACTIONS.ADMIN_BALANCE_ADJUST,
      message: `Admin "${auth.user.username}" adjusted balance for "${user.username}" by ${parsed.data.adjustment >= 0 ? "+" : ""}${parsed.data.adjustment}`,
      userId: auth.user.id,
      username: auth.user.username,
      metadata: {
        targetUserId: id,
        targetUsername: user.username,
        adjustment: parsed.data.adjustment,
        newBalance: Number(updated.balance),
      },
      request,
    });

    return jsonSuccess({
      user: { ...updated, balance: Number(updated.balance) },
      message: `Balance adjusted by ${parsed.data.adjustment >= 0 ? "+" : ""}${parsed.data.adjustment}`,
    });
  } catch {
    return jsonError("Failed to adjust balance", 500);
  }
}
