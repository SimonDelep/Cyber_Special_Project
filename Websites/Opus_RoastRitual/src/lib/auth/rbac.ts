import type { Role } from "@/generated/prisma/enums";

export function isAdmin(role: Role | undefined): boolean {
  return role === "ADMIN";
}

export function canAccessAdmin(role: Role | undefined): boolean {
  return isAdmin(role);
}
