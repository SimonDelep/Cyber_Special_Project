import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getDb } from '@/db';
import { users, type UserRole } from '@/db/schema';
import type { PublicUser, RegisterInput, UpdateProfileInput } from '@/lib/auth/types';
import { hashPassword, validatePassword, verifyPassword } from '@/lib/auth/password';
import {
  validateDisplayName,
  validateEmail,
  validateProfilePictureUrl,
  validateUsername,
} from '@/lib/auth/validation';

export function toPublicUser(row: typeof users.$inferSelect): PublicUser {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    displayName: row.displayName,
    bio: row.bio,
    profilePicture: row.profilePicture,
    role: row.role,
    balance: row.balance,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function findUserByUsername(username: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  return row ?? null;
}

export async function findUserById(id: string) {
  const db = getDb();
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return row ?? null;
}

export async function findPublicUserById(id: string): Promise<PublicUser | null> {
  const row = await findUserById(id);
  return row ? toPublicUser(row) : null;
}

export async function listAllUsers(): Promise<PublicUser[]> {
  const db = getDb();
  const rows = await db.select().from(users);
  return rows.map(toPublicUser);
}

export async function registerUser(input: RegisterInput): Promise<PublicUser> {
  const usernameError = validateUsername(input.username);
  if (usernameError) throw new Error(usernameError);

  const emailError = validateEmail(input.email);
  if (emailError) throw new Error(emailError);

  const passwordError = validatePassword(input.password);
  if (passwordError) throw new Error(passwordError);

  const displayNameError = validateDisplayName(input.displayName);
  if (displayNameError) throw new Error(displayNameError);

  const db = getDb();
  const existing = await findUserByUsername(input.username);
  if (existing) throw new Error('Username is already taken.');

  const [emailTaken] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email.toLowerCase()))
    .limit(1);
  if (emailTaken) throw new Error('Email is already registered.');

  const now = new Date();
  const passwordHash = await hashPassword(input.password);

  const [row] = await db
    .insert(users)
    .values({
      id: nanoid(),
      username: input.username,
      email: input.email.toLowerCase(),
      passwordHash,
      displayName: input.displayName.trim(),
      bio: '',
      profilePicture: null,
      role: 'user',
      balance: 0,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return toPublicUser(row);
}

export async function authenticateUser(
  username: string,
  password: string,
): Promise<PublicUser | null> {
  const row = await findUserByUsername(username);
  if (!row) return null;

  const valid = await verifyPassword(password, row.passwordHash);
  if (!valid) return null;

  return toPublicUser(row);
}

export async function updateUserProfile(
  userId: string,
  input: UpdateProfileInput,
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

  if (input.profilePicture !== undefined) {
    if (input.profilePicture === null || input.profilePicture === '') {
      updates.profilePicture = null;
    } else {
      const err = validateProfilePictureUrl(input.profilePicture);
      if (err) throw new Error(err);
      updates.profilePicture = input.profilePicture;
    }
  }

  if (input.newPassword) {
    const passwordError = validatePassword(input.newPassword);
    if (passwordError) throw new Error(passwordError);
    if (!input.currentPassword) {
      throw new Error('Current password is required to set a new password.');
    }
    const valid = await verifyPassword(input.currentPassword, row.passwordHash);
    if (!valid) throw new Error('Current password is incorrect.');
    updates.passwordHash = await hashPassword(input.newPassword);
  }

  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, userId))
    .returning();

  return toPublicUser(updated);
}

export async function setUserProfilePicture(
  userId: string,
  picturePath: string,
): Promise<PublicUser> {
  const db = getDb();
  const [updated] = await db
    .update(users)
    .set({ profilePicture: picturePath, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();
  return toPublicUser(updated);
}

export async function deleteUserAccount(userId: string): Promise<void> {
  const db = getDb();
  await db.delete(users).where(eq(users.id, userId));
}

export async function createSeedUser(options: {
  username: string;
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  profilePicture?: string | null;
  balance?: number;
}): Promise<PublicUser> {
  const db = getDb();
  const existing = await findUserByUsername(options.username);
  if (existing) return toPublicUser(existing);

  const now = new Date();
  const passwordHash = await hashPassword(options.password);

  const [row] = await db
    .insert(users)
    .values({
      id: nanoid(),
      username: options.username,
      email: options.email.toLowerCase(),
      passwordHash,
      displayName: options.displayName,
      bio: options.role === 'admin' ? 'VoltStream administrator account.' : '',
      profilePicture: options.profilePicture ?? null,
      role: options.role,
      balance: options.balance ?? 0,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return toPublicUser(row);
}
