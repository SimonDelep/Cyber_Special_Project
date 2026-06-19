import { auth } from "@/auth";
import { redirect } from "next/navigation";

import type { Role } from "@/generated/prisma/enums";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/profile");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    redirect("/profile?error=unauthorized");
  }
  return user;
}

export function hasRole(userRole: Role | undefined, allowed: Role[]): boolean {
  return userRole !== undefined && allowed.includes(userRole);
}
