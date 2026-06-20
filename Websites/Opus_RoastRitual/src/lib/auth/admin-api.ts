import { NextResponse } from "next/server";

import { auth } from "@/auth";

export async function requireAdminApi() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }
  if (session.user.role !== "ADMIN") {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    } as const;
  }
  return { admin: session.user } as const;
}
