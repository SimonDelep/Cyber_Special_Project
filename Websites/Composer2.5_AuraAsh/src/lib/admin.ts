import { NextResponse } from "next/server";
import { Role } from "@/generated/prisma/client";
import { getCurrentUser, type SafeUser } from "@/lib/auth";

type AdminResult =
  | { user: SafeUser; error: null }
  | { user: null; error: NextResponse };

export async function requireAdminApi(): Promise<AdminResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }

  if (user.role !== Role.ADMIN) {
    return {
      user: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { user, error: null };
}
