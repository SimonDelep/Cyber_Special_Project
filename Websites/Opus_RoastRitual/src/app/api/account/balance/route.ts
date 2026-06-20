import { NextResponse } from "next/server";

import { requireAuthApi } from "@/lib/auth/api-auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const authResult = await requireAuthApi();
  if ("error" in authResult) return authResult.error;

  const user = await db.user.findUnique({
    where: { id: authResult.user.id },
    select: { balanceCents: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  return NextResponse.json({ balanceCents: user.balanceCents });
}
