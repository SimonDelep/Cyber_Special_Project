import { auth } from "@/auth";

export async function requireUser() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }
  return { session, userId };
}

export async function requireAdmin() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("UNAUTHORIZED");
  if (session.user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return { session, userId };
}

