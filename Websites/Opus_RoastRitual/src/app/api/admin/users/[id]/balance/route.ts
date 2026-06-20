import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/auth/admin-api";
import { db } from "@/lib/db";
import { LogAction } from "@/lib/monitoring/actions";
import { logEvent } from "@/lib/monitoring/system-log";
import { balanceAdjustSchema } from "@/lib/validations/admin";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = balanceAdjustSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { adjustmentCents, reason } = parsed.data;

    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id } });
      if (!user) return null;

      const balanceAfter = user.balanceCents + adjustmentCents;
      if (balanceAfter < 0) {
        throw new Error("NEGATIVE_BALANCE");
      }

      const updated = await tx.user.update({
        where: { id },
        data: { balanceCents: balanceAfter },
        select: { id: true, username: true, balanceCents: true },
      });

      await tx.balanceAdjustment.create({
        data: {
          userId: id,
          adminId: authResult.admin.id,
          adjustmentCents,
          balanceAfter,
          reason: reason?.trim() || null,
        },
      });

      return updated;
    });

    if (!result) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await logEvent({
      category: "ADMIN",
      action: LogAction.BALANCE_ADJUSTMENT,
      message: `Admin adjusted balance for "${result.username}"`,
      userId: authResult.admin.id,
      username: authResult.admin.username,
      request,
      metadata: {
        targetUserId: id,
        targetUsername: result.username,
        adjustmentCents,
        balanceAfter: result.balanceCents,
        reason: reason?.trim() || null,
      },
      success: true,
    });

    return NextResponse.json({ user: result });
  } catch (error) {
    if (error instanceof Error && error.message === "NEGATIVE_BALANCE") {
      return NextResponse.json(
        { error: "Balance cannot go below zero" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Unable to adjust balance" },
      { status: 500 },
    );
  }
}
