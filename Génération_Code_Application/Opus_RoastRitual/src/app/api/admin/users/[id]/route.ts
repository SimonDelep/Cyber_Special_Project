import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/auth/admin-api";
import { db } from "@/lib/db";
import { adminUserUpdateSchema } from "@/lib/validations/admin";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      bio: true,
      role: true,
      balanceCents: true,
      image: true,
      createdAt: true,
      updatedAt: true,
      balanceAdjustments: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          adjustmentCents: true,
          balanceAfter: true,
          reason: true,
          createdAt: true,
          admin: { select: { username: true } },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = adminUserUpdateSchema.safeParse(body);

    if (
      id === authResult.admin.id &&
      parsed.success &&
      parsed.data.role &&
      parsed.data.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { error: "You cannot remove your own admin role" },
        { status: 400 },
      );
    }

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (data.username && data.username !== existing.username) {
      const taken = await db.user.findUnique({
        where: { username: data.username },
      });
      if (taken) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 409 },
        );
      }
    }

    const emailValue =
      data.email === undefined
        ? undefined
        : data.email?.trim()
          ? data.email.trim()
          : null;

    if (emailValue) {
      const emailTaken = await db.user.findFirst({
        where: { email: emailValue, NOT: { id } },
      });
      if (emailTaken) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 409 },
        );
      }
    }

    const user = await db.user.update({
      where: { id },
      data: {
        ...(data.username !== undefined && { username: data.username }),
        ...(data.name !== undefined && {
          name: data.name?.trim() ? data.name.trim() : null,
        }),
        ...(emailValue !== undefined && { email: emailValue }),
        ...(data.bio !== undefined && {
          bio: data.bio?.trim() ? data.bio.trim() : null,
        }),
        ...(data.role !== undefined && { role: data.role }),
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        bio: true,
        role: true,
        balanceCents: true,
      },
    });

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json(
      { error: "Unable to update user" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;

  if (id === authResult.admin.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account from admin" },
      { status: 400 },
    );
  }

  try {
    await db.user.delete({ where: { id } });
    return NextResponse.json({ message: "User deleted" });
  } catch {
    return NextResponse.json(
      { error: "Unable to delete user" },
      { status: 500 },
    );
  }
}
