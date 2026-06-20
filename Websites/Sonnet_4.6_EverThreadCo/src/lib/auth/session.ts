import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { isAdmin } from "@/lib/rbac";
import type { Role } from "@/generated/prisma/client";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

export async function requireAuth(redirectTo = "/login") {
  const session = await getSession();
  if (!session?.user) {
    redirect(redirectTo);
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (!isAdmin(session.user.role as Role)) {
    redirect("/");
  }
  return session;
}
