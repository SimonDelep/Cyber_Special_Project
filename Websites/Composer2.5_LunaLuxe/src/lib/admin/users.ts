import { db } from '@/db';
import { users, type PublicUser, type UserRole } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { findUserById, findUserByEmail, findUserByUsername, toPublicUser } from '@/lib/auth/users';
import { validateEmail } from '@/lib/auth/password';

export async function getAllUsersWithBalance(): Promise<PublicUser[]> {
  const rows = await db.select().from(users);
  return rows.map(toPublicUser);
}

export async function adminUpdateUser(
  userId: number,
  data: {
    displayName?: string;
    email?: string;
    bio?: string;
    role?: UserRole;
    avatarUrl?: string | null;
  }
): Promise<PublicUser | undefined> {
  const existing = await findUserById(userId);
  if (!existing) return undefined;

  if (data.email) {
    const emailErr = validateEmail(data.email);
    if (emailErr) throw new Error(emailErr);
    const conflict = await findUserByEmail(data.email);
    if (conflict && conflict.id !== userId) throw new Error('Email is already in use.');
  }

  const [user] = await db
    .update(users)
    .set({
      displayName: data.displayName ?? existing.displayName,
      email: data.email?.toLowerCase() ?? existing.email,
      bio: data.bio ?? existing.bio,
      role: data.role ?? existing.role,
      avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : existing.avatarUrl,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, userId))
    .returning();

  return toPublicUser(user);
}

export async function setUserBalance(userId: number, balance: number): Promise<PublicUser | undefined> {
  if (!Number.isFinite(balance) || balance < 0) {
    throw new Error('Balance must be a non-negative number.');
  }

  const [user] = await db
    .update(users)
    .set({ balance, updatedAt: new Date().toISOString() })
    .where(eq(users.id, userId))
    .returning();

  return user ? toPublicUser(user) : undefined;
}

export async function adjustUserBalance(
  userId: number,
  delta: number
): Promise<PublicUser | undefined> {
  if (!Number.isFinite(delta)) {
    throw new Error('Adjustment must be a valid number.');
  }

  const existing = await findUserById(userId);
  if (!existing) return undefined;

  const newBalance = Math.max(0, (existing.balance ?? 0) + delta);
  return setUserBalance(userId, newBalance);
}

export async function adminDeleteUser(userId: number, actingAdminId: number): Promise<void> {
  if (userId === actingAdminId) {
    throw new Error('You cannot delete your own account from the admin panel.');
  }
  const target = await findUserById(userId);
  if (!target) throw new Error('User not found.');
  await db.delete(users).where(eq(users.id, userId));
}

export async function isUsernameTaken(username: string, excludeId?: number): Promise<boolean> {
  const user = await findUserByUsername(username);
  if (!user) return false;
  return excludeId ? user.id !== excludeId : true;
}
