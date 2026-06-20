import { db } from '@/db';
import { users, type PublicUser, type User, type UserRole } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth/password';

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    bio: user.bio ?? '',
    avatarUrl: user.avatarUrl,
    role: user.role === 'admin' ? 'admin' : 'user',
    balance: user.balance ?? 0,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function findUserByUsername(username: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return user;
}

export async function findUserById(id: number): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user;
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return user;
}

export async function getAllUsers(): Promise<PublicUser[]> {
  const rows = await db.select().from(users);
  return rows.map(toPublicUser);
}

export async function createUser(data: {
  username: string;
  email: string;
  password: string;
  displayName: string;
  role?: UserRole;
}): Promise<PublicUser> {
  const now = new Date().toISOString();
  const passwordHash = await hashPassword(data.password);

  const [user] = await db
    .insert(users)
    .values({
      username: data.username,
      email: data.email.toLowerCase(),
      passwordHash,
      displayName: data.displayName,
      role: data.role ?? 'user',
      balance: 0,
      bio: '',
      avatarUrl: null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return toPublicUser(user);
}

export async function updateUserProfile(
  userId: number,
  data: {
    displayName?: string;
    email?: string;
    bio?: string;
    avatarUrl?: string | null;
  }
): Promise<PublicUser | undefined> {
  const existing = await findUserById(userId);
  if (!existing) return undefined;

  const now = new Date().toISOString();
  const [user] = await db
    .update(users)
    .set({
      displayName: data.displayName ?? existing.displayName,
      email: data.email?.toLowerCase() ?? existing.email,
      bio: data.bio ?? existing.bio,
      avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : existing.avatarUrl,
      updatedAt: now,
    })
    .where(eq(users.id, userId))
    .returning();

  return toPublicUser(user);
}

export async function updateUserPassword(userId: number, password: string): Promise<void> {
  const passwordHash = await hashPassword(password);
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date().toISOString() })
    .where(eq(users.id, userId));
}

export async function deleteUser(userId: number): Promise<void> {
  await db.delete(users).where(eq(users.id, userId));
}
