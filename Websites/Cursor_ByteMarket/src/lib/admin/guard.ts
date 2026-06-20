import type { AstroCookies } from "astro";
import type { AuthUser } from "@/types/auth";
import { getCurrentUser } from "@/lib/auth";

export function getAdminActor(cookies: AstroCookies): AuthUser | null {
  const user = getCurrentUser(cookies);
  if (!user || user.role !== "admin") return null;
  return user;
}

export function parseDollarsToCents(value: string): { cents?: number; error?: string } {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return { error: "Amount is required." };
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) return { error: "Enter a valid amount." };
  return { cents: Math.round(amount * 100) };
}

export function parseSignedDollarsToCents(value: string): { cents?: number; error?: string } {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return { error: "Amount is required." };
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount === 0) {
    return { error: "Enter a non-zero amount (use + or -)." };
  }
  return { cents: Math.round(amount * 100) };
}
