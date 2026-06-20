import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { users, type UserRole } from "@/db/schema";
import type { AuthUser } from "@/types/auth";
import {
  PASSWORD_MIN,
  USERNAME_MAX,
  USERNAME_MIN,
  USERNAME_PATTERN,
} from "@/lib/auth/constants";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { deleteLocalAvatar, isLocalAvatarUrl, validateAvatarUrl } from "@/lib/avatar";
import { destroyAllUserSessions } from "@/lib/auth/session";

function toAuthUser(row: typeof users.$inferSelect): AuthUser {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    displayName: row.displayName,
    email: row.email,
    avatarUrl: row.avatarUrl,
    balanceCents: row.balanceCents,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function validateUsername(username: string): string | null {
  const value = username.trim();
  if (value.length < USERNAME_MIN || value.length > USERNAME_MAX) {
    return `Username must be ${USERNAME_MIN}–${USERNAME_MAX} characters.`;
  }
  if (!USERNAME_PATTERN.test(value)) {
    return "Username may only contain letters, numbers, and underscores.";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN) {
    return `Password must be at least ${PASSWORD_MIN} characters.`;
  }
  return null;
}

export function validateEmail(email: string): string | null {
  const value = email.trim();
  if (!value) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return "Enter a valid email address.";
  }
  return null;
}

export function findUserByUsername(username: string) {
  const db = getDb();
  return db
    .select()
    .from(users)
    .where(eq(users.username, username.trim()))
    .get();
}

export function findUserById(id: number) {
  const db = getDb();
  return db.select().from(users).where(eq(users.id, id)).get();
}

export function listUsers() {
  const db = getDb();
  return db.select().from(users).orderBy(asc(users.username)).all();
}

export function registerUser(input: {
  username: string;
  password: string;
  displayName?: string;
  email?: string;
  role?: UserRole;
}): { user?: AuthUser; error?: string } {
  const usernameError = validateUsername(input.username);
  if (usernameError) return { error: usernameError };

  const passwordError = validatePassword(input.password);
  if (passwordError) return { error: passwordError };

  if (input.email) {
    const emailError = validateEmail(input.email);
    if (emailError) return { error: emailError };
  }

  const db = getDb();
  const existing = findUserByUsername(input.username);
  if (existing) return { error: "Username is already taken." };

  const now = new Date();
  const inserted = db
    .insert(users)
    .values({
      username: input.username.trim(),
      passwordHash: hashPassword(input.password),
      role: input.role ?? "user",
      displayName: input.displayName?.trim() || null,
      email: input.email?.trim() || null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  return { user: toAuthUser(inserted) };
}

export function authenticateUser(
  username: string,
  password: string,
): { user?: AuthUser; error?: string } {
  const user = findUserByUsername(username);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Invalid username or password." };
  }
  return { user: toAuthUser(user) };
}

export function updateUserProfile(
  userId: number,
  input: {
    displayName?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  },
): { user?: AuthUser; error?: string } {
  const db = getDb();
  const existing = findUserById(userId);
  if (!existing) return { error: "User not found." };

  if (input.newPassword) {
    if (!input.currentPassword) {
      return { error: "Current password is required to set a new password." };
    }
    if (!verifyPassword(input.currentPassword, existing.passwordHash)) {
      return { error: "Current password is incorrect." };
    }
    const passwordError = validatePassword(input.newPassword);
    if (passwordError) return { error: passwordError };
  }

  if (input.email !== undefined && input.email.trim()) {
    const emailError = validateEmail(input.email);
    if (emailError) return { error: emailError };
  }

  const updated = db
    .update(users)
    .set({
      displayName:
        input.displayName !== undefined
          ? input.displayName.trim() || null
          : existing.displayName,
      email:
        input.email !== undefined ? input.email.trim() || null : existing.email,
      passwordHash: input.newPassword
        ? hashPassword(input.newPassword)
        : existing.passwordHash,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning()
    .get();

  return { user: toAuthUser(updated) };
}

export function updateUserAvatar(
  userId: number,
  avatarUrl: string | null,
): { user?: AuthUser; error?: string } {
  const existing = findUserById(userId);
  if (!existing) return { error: "User not found." };

  if (avatarUrl) {
    if (!isLocalAvatarUrl(avatarUrl)) {
      const urlError = validateAvatarUrl(avatarUrl);
      if (urlError) return { error: urlError };
    }
  }

  if (isLocalAvatarUrl(existing.avatarUrl) && existing.avatarUrl !== avatarUrl) {
    deleteLocalAvatar(existing.avatarUrl);
  }

  const db = getDb();
  const updated = db
    .update(users)
    .set({
      avatarUrl,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning()
    .get();

  return { user: toAuthUser(updated) };
}

export function clearUserAvatar(userId: number): { user?: AuthUser; error?: string } {
  return updateUserAvatar(userId, null);
}

export function deleteUserAccount(
  userId: number,
  password: string,
): { ok: boolean; error?: string } {
  const existing = findUserById(userId);
  if (!existing) return { ok: false, error: "User not found." };
  if (!verifyPassword(password, existing.passwordHash)) {
    return { ok: false, error: "Password is incorrect." };
  }

  deleteLocalAvatar(existing.avatarUrl);
  destroyAllUserSessions(userId);
  const db = getDb();
  db.delete(users).where(eq(users.id, userId)).run();
  return { ok: true };
}

export function adminCreateUser(
  actor: AuthUser,
  input: {
    username: string;
    password: string;
    displayName?: string;
    email?: string;
    role?: UserRole;
    balanceCents?: number;
  },
): { user?: AuthUser; error?: string } {
  if (actor.role !== "admin") {
    return { error: "Admin access required." };
  }

  const balanceCents = input.balanceCents ?? 0;
  if (!Number.isInteger(balanceCents) || balanceCents < 0) {
    return { error: "Balance must be a non-negative whole number of cents." };
  }

  const result = registerUser({
    username: input.username,
    password: input.password,
    displayName: input.displayName,
    email: input.email,
    role: input.role ?? "user",
  });

  if (result.error || !result.user) {
    return result;
  }

  if (balanceCents > 0) {
    const db = getDb();
    db.update(users)
      .set({ balanceCents, updatedAt: new Date() })
      .where(eq(users.id, result.user.id))
      .run();
    const refreshed = findUserById(result.user.id);
    if (refreshed) return { user: toAuthUser(refreshed) };
  }

  return result;
}

export function adminUpdateUser(
  actor: AuthUser,
  targetUserId: number,
  input: {
    displayName?: string;
    email?: string;
    password?: string;
    role?: UserRole;
  },
): { user?: AuthUser; error?: string } {
  if (actor.role !== "admin") {
    return { error: "Admin access required." };
  }

  const existing = findUserById(targetUserId);
  if (!existing) return { error: "User not found." };

  if (input.role !== undefined && actor.id === targetUserId) {
    return { error: "You cannot change your own role." };
  }

  if (input.password) {
    const passwordError = validatePassword(input.password);
    if (passwordError) return { error: passwordError };
  }

  if (input.email !== undefined && input.email.trim()) {
    const emailError = validateEmail(input.email);
    if (emailError) return { error: emailError };
  }

  const db = getDb();
  const updated = db
    .update(users)
    .set({
      displayName:
        input.displayName !== undefined
          ? input.displayName.trim() || null
          : existing.displayName,
      email:
        input.email !== undefined ? input.email.trim() || null : existing.email,
      passwordHash: input.password
        ? hashPassword(input.password)
        : existing.passwordHash,
      role: input.role ?? existing.role,
      updatedAt: new Date(),
    })
    .where(eq(users.id, targetUserId))
    .returning()
    .get();

  return { user: toAuthUser(updated) };
}

export function adminAdjustUserBalance(
  actor: AuthUser,
  targetUserId: number,
  deltaCents: number,
): { user?: AuthUser; error?: string } {
  if (actor.role !== "admin") {
    return { error: "Admin access required." };
  }
  if (!Number.isInteger(deltaCents) || deltaCents === 0) {
    return { error: "Enter a non-zero adjustment in cents." };
  }

  const existing = findUserById(targetUserId);
  if (!existing) return { error: "User not found." };

  const nextBalance = existing.balanceCents + deltaCents;
  if (nextBalance < 0) {
    return { error: "Balance cannot be negative." };
  }

  const db = getDb();
  const updated = db
    .update(users)
    .set({ balanceCents: nextBalance, updatedAt: new Date() })
    .where(eq(users.id, targetUserId))
    .returning()
    .get();

  return { user: toAuthUser(updated) };
}

export function adminSetUserBalance(
  actor: AuthUser,
  targetUserId: number,
  balanceCents: number,
): { user?: AuthUser; error?: string } {
  if (actor.role !== "admin") {
    return { error: "Admin access required." };
  }
  if (!Number.isInteger(balanceCents) || balanceCents < 0) {
    return { error: "Balance must be a non-negative whole number of cents." };
  }

  const existing = findUserById(targetUserId);
  if (!existing) return { error: "User not found." };

  const db = getDb();
  const updated = db
    .update(users)
    .set({ balanceCents, updatedAt: new Date() })
    .where(eq(users.id, targetUserId))
    .returning()
    .get();

  return { user: toAuthUser(updated) };
}

export function adminUpdateUserRole(
  actor: AuthUser,
  targetUserId: number,
  role: UserRole,
): { ok: boolean; error?: string } {
  if (actor.role !== "admin") {
    return { ok: false, error: "Admin access required." };
  }
  if (actor.id === targetUserId) {
    return { ok: false, error: "You cannot change your own role." };
  }

  const db = getDb();
  const target = findUserById(targetUserId);
  if (!target) return { ok: false, error: "User not found." };

  db.update(users)
    .set({ role, updatedAt: new Date() })
    .where(eq(users.id, targetUserId))
    .run();

  return { ok: true };
}

export function adminDeleteUser(
  actor: AuthUser,
  targetUserId: number,
): { ok: boolean; error?: string } {
  if (actor.role !== "admin") {
    return { ok: false, error: "Admin access required." };
  }
  if (actor.id === targetUserId) {
    return { ok: false, error: "You cannot delete your own account from admin." };
  }

  const target = findUserById(targetUserId);
  if (!target) return { ok: false, error: "User not found." };

  deleteLocalAvatar(target.avatarUrl);
  destroyAllUserSessions(targetUserId);
  const db = getDb();
  db.delete(users).where(eq(users.id, targetUserId)).run();
  return { ok: true };
}

export function isAdmin(user: AuthUser | null | undefined): boolean {
  return user?.role === "admin";
}

export function requireAuth(user: AuthUser | null | undefined): AuthUser {
  if (!user) throw new Error("Authentication required.");
  return user;
}

export function requireAdmin(user: AuthUser | null | undefined): AuthUser {
  const authUser = requireAuth(user);
  if (authUser.role !== "admin") throw new Error("Admin access required.");
  return authUser;
}
