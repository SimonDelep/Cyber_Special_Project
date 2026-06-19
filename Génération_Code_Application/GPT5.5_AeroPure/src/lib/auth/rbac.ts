import { Role } from "@prisma/client";
import type { SessionUser } from "@/lib/auth/session";

export function isAdmin(user: SessionUser | null): boolean {
  return user?.role === Role.ADMIN;
}

export function isAuthenticated(user: SessionUser | null): user is SessionUser {
  return user !== null;
}

export function requireAuth(user: SessionUser | null): SessionUser {
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export function requireAdmin(user: SessionUser | null): SessionUser {
  const authUser = requireAuth(user);
  if (authUser.role !== Role.ADMIN) {
    throw new Error("FORBIDDEN");
  }
  return authUser;
}
