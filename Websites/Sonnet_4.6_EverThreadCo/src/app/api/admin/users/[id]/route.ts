import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { EventActions } from "@/lib/events/actions";
import { logEvent } from "@/lib/events/logger";
import { prisma } from "@/lib/prisma";
import {
  adminBalanceAdjustSchema,
  adminUserUpdateSchema,
} from "@/lib/validations/admin";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      balanceCents: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = adminUserUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (
      parsed.data.role === "USER" &&
      existing.role === "ADMIN" &&
      existing.id === auth.session!.user.id
    ) {
      return NextResponse.json(
        { error: "You cannot demote your own admin account" },
        { status: 400 },
      );
    }

    if (parsed.data.email) {
      const emailTaken = await prisma.user.findFirst({
        where: { email: parsed.data.email.toLowerCase(), NOT: { id } },
      });
      if (emailTaken) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(parsed.data.email !== undefined
          ? { email: parsed.data.email.toLowerCase() }
          : {}),
        ...(parsed.data.displayName !== undefined
          ? { displayName: parsed.data.displayName }
          : {}),
        ...(parsed.data.bio !== undefined ? { bio: parsed.data.bio } : {}),
        ...(parsed.data.role !== undefined ? { role: parsed.data.role } : {}),
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        displayName: true,
        bio: true,
        balanceCents: true,
      },
    });

    await logEvent({
      category: "ADMIN",
      action: EventActions.ADMIN_USER_UPDATE,
      message: `Admin updated user @${user.username}`,
      userId: auth.session!.user.id,
      username: auth.session!.user.username,
      request,
      metadata: {
        targetUserId: user.id,
        targetUsername: user.username,
        role: user.role,
      },
    });

    return NextResponse.json({ message: "User updated", user });
  } catch {
    return NextResponse.json({ error: "Unable to update user" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = adminBalanceAdjustSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { mode, amountCents } = parsed.data;
    let balanceCents: number;

    if (mode === "set") {
      if (amountCents < 0) {
        return NextResponse.json(
          { error: "Balance cannot be negative" },
          { status: 400 },
        );
      }
      balanceCents = amountCents;
    } else {
      balanceCents = user.balanceCents + amountCents;
      if (balanceCents < 0) {
        return NextResponse.json(
          { error: "Balance cannot go below zero" },
          { status: 400 },
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { balanceCents },
      select: {
        id: true,
        username: true,
        balanceCents: true,
      },
    });

    await logEvent({
      category: "ADMIN",
      action: EventActions.ADMIN_BALANCE_ADJUST,
      message: `Admin adjusted balance for @${updated.username} (${mode} ${amountCents} cents)`,
      userId: auth.session!.user.id,
      username: auth.session!.user.username,
      request,
      metadata: {
        targetUserId: updated.id,
        mode,
        amountCents,
        previousBalanceCents: user.balanceCents,
        newBalanceCents: updated.balanceCents,
        note: parsed.data.note,
      },
    });

    return NextResponse.json({
      message: "Balance updated",
      user: updated,
      previousBalanceCents: user.balanceCents,
      note: parsed.data.note,
    });
  } catch {
    return NextResponse.json({ error: "Unable to adjust balance" }, { status: 500 });
  }
}
