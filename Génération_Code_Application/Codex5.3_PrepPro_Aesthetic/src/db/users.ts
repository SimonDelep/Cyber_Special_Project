import { eq, and, ne } from "drizzle-orm";
import { getDb } from "./client";
import { users, type User, type UserRole } from "./schema";

export function findUserByUsername(username: string): User | undefined {
  const db = getDb();
  return db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1)
    .all()[0];
}

export function findUserByEmail(email: string): User | undefined {
  const db = getDb();
  return db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
    .all()[0];
}

export function findUserById(id: number): User | undefined {
  const db = getDb();
  return db.select().from(users).where(eq(users.id, id)).limit(1).all()[0];
}

export function findUserByUsernameOrEmail(
  identifier: string,
): User | undefined {
  return findUserByUsername(identifier) ?? findUserByEmail(identifier);
}

export function createUser(data: {
  username: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role?: UserRole;
}): User {
  const db = getDb();
  const now = new Date().toISOString();

  const inserted = db
    .insert(users)
    .values({
      username: data.username,
      email: data.email,
      passwordHash: data.passwordHash,
      displayName: data.displayName,
      role: data.role ?? "user",
      bio: "",
      updatedAt: now,
    })
    .returning()
    .all();

  return inserted[0]!;
}

export function emailTakenByOther(email: string, userId: number): boolean {
  const db = getDb();
  const row = db
    .select()
    .from(users)
    .where(and(eq(users.email, email), ne(users.id, userId)))
    .limit(1)
    .all()[0];
  return Boolean(row);
}

export function updateUser(
  id: number,
  data: Partial<{
    email: string;
    displayName: string;
    bio: string;
    avatarUrl: string | null;
    passwordHash: string;
    role: UserRole;
    balanceCents: number;
  }>,
): User | undefined {
  const db = getDb();
  const now = new Date().toISOString();

  db.update(users)
    .set({ ...data, updatedAt: now })
    .where(eq(users.id, id))
    .run();

  return findUserById(id);
}

export function deleteUser(id: number): void {
  const db = getDb();
  db.delete(users).where(eq(users.id, id)).run();
}

export function listAllUsers(): User[] {
  const db = getDb();
  return db.select().from(users).all();
}

export function countUsers(): number {
  const db = getDb();
  return db.select().from(users).all().length;
}
