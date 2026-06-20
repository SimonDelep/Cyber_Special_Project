import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      displayName: true,
      balanceCents: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ users });
}
