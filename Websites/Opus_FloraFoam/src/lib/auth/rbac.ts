import type { Role } from "@prisma/client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requireAuth(redirectTo = "/login") {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(redirectTo);
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") {
    redirect("/");
  }
  return session;
}

export function hasRole(role: Role | undefined, allowed: Role[]): boolean {
  return !!role && allowed.includes(role);
}
