import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";

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

function serializeUser(user: {
  id: string;
  username: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  balance: { toString(): string };
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...user,
    balance: decimalToNumber(user.balance),
  };
}

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  const users = await prisma.user.findMany({
    select: userSelect,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    users: users.map(serializeUser),
  });
}
