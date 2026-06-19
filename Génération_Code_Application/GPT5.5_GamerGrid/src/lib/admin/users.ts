import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { users, userRoles, type UserRole } from '@/db/schema';
import type { AdminUpdateUserInput, PublicUser } from '@/lib/auth/types';
import { toPublicUser, findUserById } from '@/lib/auth/user';
import {
  validateDisplayName,
  validateEmail,
} from '@/lib/auth/validation';

export async function adminUpdateUser(
  userId: string,
  input: AdminUpdateUserInput,
  actingAdminId: string,
): Promise<PublicUser> {
  const row = await findUserById(userId);
  if (!row) throw new Error('User not found.');

  const db = getDb();
  const updates: Partial<typeof users.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.displayName !== undefined) {
    const err = validateDisplayName(input.displayName);
    if (err) throw new Error(err);
    updates.displayName = input.displayName.trim();
  }

  if (input.email !== undefined) {
    const err = validateEmail(input.email);
    if (err) throw new Error(err);
    const normalized = input.email.toLowerCase();
    const [taken] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalized))
      .limit(1);
    if (taken && taken.id !== userId) {
      throw new Error('Email is already registered.');
    }
    updates.email = normalized;
  }

  if (input.bio !== undefined) {
    updates.bio = input.bio.slice(0, 500);
  }

  if (input.role !== undefined) {
    if (!userRoles.includes(input.role)) {
      throw new Error('Invalid role.');
    }
    if (userId === actingAdminId && input.role !== 'admin') {
      throw new Error('You cannot remove your own administrator role.');
    }
    updates.role = input.role;
  }

  if (input.balance !== undefined) {
    if (typeof input.balance !== 'number' || input.balance < 0) {
      throw new Error('Balance must be a non-negative number.');
    }
    updates.balance = Math.round(input.balance * 100) / 100;
  } else if (input.balanceDelta !== undefined) {
    if (typeof input.balanceDelta !== 'number') {
      throw new Error('Balance adjustment must be a number.');
    }
    const next = Math.round((row.balance + input.balanceDelta) * 100) / 100;
    if (next < 0) {
      throw new Error('Balance cannot fall below zero.');
    }
    updates.balance = next;
  }

  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, userId))
    .returning();

  return toPublicUser(updated);
}

export async function adminDeleteUser(
  userId: string,
  actingAdminId: string,
): Promise<void> {
  if (userId === actingAdminId) {
    throw new Error('You cannot delete your own account from the admin panel.');
  }
  const row = await findUserById(userId);
  if (!row) throw new Error('User not found.');

  const db = getDb();
  await db.delete(users).where(eq(users.id, userId));
}
