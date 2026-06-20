import { auth } from "@/auth";
import type { Role } from "@prisma/client";
import { redirect } from "next/navigation";

export async function getSession() {
  return auth();
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") {
    redirect("/account");
  }
  return session;
}

export async function requireRole(role: Role) {
  const session = await requireAuth();
  if (session.user.role !== role) {
    redirect("/account");
  }
  return session;
}

export type SafeUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  balanceCents: number;
  createdAt: Date;
  updatedAt: Date;
};

export function toSafeUser(user: {
  id: string;
  email: string;
  name: string;
  role: Role;
  balanceCents: number;
  createdAt: Date;
  updatedAt: Date;
}): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    balanceCents: user.balanceCents,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function countAdmins(excludeUserId?: string) {
  const { prisma } = await import("@/lib/prisma");
  return prisma.user.count({
    where: {
      role: "ADMIN",
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
  });
}
