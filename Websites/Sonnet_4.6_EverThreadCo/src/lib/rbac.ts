import type { Role } from "@/generated/prisma/client";

export type SessionRole = Role;

export function isAdmin(role: SessionRole | undefined): boolean {
  return role === "ADMIN";
}

export function isUser(role: SessionRole | undefined): boolean {
  return role === "USER" || role === "ADMIN";
}

export function roleLabel(role: SessionRole): string {
  return role === "ADMIN" ? "Administrator" : "Standard user";
}
