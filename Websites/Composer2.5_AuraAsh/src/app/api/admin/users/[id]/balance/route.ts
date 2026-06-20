import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";
import { balanceAdjustSchema, balanceSetSchema } from "@/lib/validations/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const { id } = await context.params;
  const body = await request.json();

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if ("balance" in body) {
    const parsed = balanceSetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { balance: parsed.data.balance },
      select: {
        id: true,
        username: true,
        balance: true,
      },
    });

    return NextResponse.json({
      user: { ...updated, balance: decimalToNumber(updated.balance) },
      action: "set",
    });
  }

  const parsed = balanceAdjustSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const currentBalance = decimalToNumber(existing.balance);
  const newBalance = currentBalance + parsed.data.adjustment;

  if (newBalance < 0) {
    return NextResponse.json(
      { error: "Balance cannot go below zero" },
      { status: 400 },
    );
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { balance: newBalance },
    select: {
      id: true,
      username: true,
      balance: true,
    },
  });

  return NextResponse.json({
    user: { ...updated, balance: decimalToNumber(updated.balance) },
    action: "adjust",
    adjustment: parsed.data.adjustment,
  });
}
