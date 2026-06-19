import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/auth/admin-api";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      role: true,
      balanceCents: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ users });
}
