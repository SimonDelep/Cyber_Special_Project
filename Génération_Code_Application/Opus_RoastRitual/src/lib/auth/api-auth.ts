import { NextResponse } from "next/server";

import { auth } from "@/auth";

export async function requireAuthApi() {
  const session = await auth();

  const userId = session?.user?.id;
  if (!userId || typeof userId !== "string") {
    return {
      error: NextResponse.json({ error: "Sign in to continue" }, { status: 401 }),
    } as const;
  }

  return { user: session.user } as const;
}
