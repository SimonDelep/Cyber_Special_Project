import { NextResponse } from "next/server";
import { Role } from "@/generated/prisma/client";
import { requireAdminApi } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";
import { adminUserUpdateSchema } from "@/lib/validations/admin";

const userSelect = {
  id: true,
  username: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  balance: true,
  createdAt: true,
  updatedAt: true,
} as const;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const { id } = await context.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: { ...user, balance: decimalToNumber(user.balance) },
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { user: admin, error } = await requireAdminApi();
  if (error) return error;

  const { id } = await context.params;
  const body = await request.json();
  const parsed = adminUserUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const data = parsed.data;

  if (data.username && data.username !== existing.username) {
    const taken = await prisma.user.findUnique({
      where: { username: data.username },
    });
    if (taken) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 },
      );
    }
  }

  const normalizedEmail = data.email === "" ? null : data.email;
  if (normalizedEmail && normalizedEmail !== existing.email) {
    const taken = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (taken) {
      return NextResponse.json(
        { error: "Email is already taken" },
        { status: 409 },
      );
    }
  }

  if (
    data.role === Role.USER &&
    existing.role === Role.ADMIN &&
    existing.id === admin.id
  ) {
    return NextResponse.json(
      { error: "You cannot demote your own admin account" },
      { status: 400 },
    );
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(data.username !== undefined && { username: data.username }),
      ...(data.email !== undefined && { email: normalizedEmail }),
      ...(data.firstName !== undefined && {
        firstName: data.firstName || null,
      }),
      ...(data.lastName !== undefined && { lastName: data.lastName || null }),
      ...(data.role !== undefined && { role: data.role }),
    },
    select: userSelect,
  });

  return NextResponse.json({
    user: { ...updated, balance: decimalToNumber(updated.balance) },
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { user: admin, error } = await requireAdminApi();
  if (error) return error;

  const { id } = await context.params;

  if (id === admin.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account from the admin panel" },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
