import type { UserRole } from "@/db/schema";
import type { PublicUser } from "./types";

export function isAdmin(user: PublicUser | null | undefined): boolean {
  return user?.role === "admin";
}

export function hasRole(
  user: PublicUser | null | undefined,
  role: UserRole,
): boolean {
  return user?.role === role;
}

export function requireUser(
  user: PublicUser | null | undefined,
): asserts user is PublicUser {
  if (!user) {
    throw new Response(JSON.stringify({ error: "Authentication required." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export function requireAdminUser(
  user: PublicUser | null | undefined,
): asserts user is PublicUser {
  requireUser(user);
  if (!isAdmin(user)) {
    throw new Response(JSON.stringify({ error: "Administrator access required." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
}
