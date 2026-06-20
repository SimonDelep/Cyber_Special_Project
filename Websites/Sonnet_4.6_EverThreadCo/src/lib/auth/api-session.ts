import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";

export async function requireUserApi() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Sign in required" }, { status: 401 }) };
  }

  return { userId: session.user.id };
}
