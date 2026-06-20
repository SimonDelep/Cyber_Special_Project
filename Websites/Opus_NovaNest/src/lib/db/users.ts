import { getSqlite } from './client';
import type { SafeUser } from './schema';
import { ROLES, type UserRole } from '../auth/constants';

type UserRow = {
  id: number;
  username: string;
  password_hash: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  role: string;
  balance_cents: number;
  created_at: string;
  updated_at: string;
};

const SELECT_COLUMNS = `
  id, username, password_hash, email, display_name, avatar_url, role, balance_cents, created_at, updated_at
`;

function mapRow(row: UserRow): SafeUser & { passwordHash: string } {
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    email: row.email,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    role: row.role,
    balanceCents: row.balance_cents,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toSafeUser(
  user: SafeUser & { passwordHash?: string },
): SafeUser {
  const { passwordHash: _, ...safe } = user as SafeUser & {
    passwordHash?: string;
  };
  return safe;
}

export function findUserById(id: number): (SafeUser & { passwordHash: string }) | null {
  const db = getSqlite();
  const row = db
    .prepare(`SELECT ${SELECT_COLUMNS} FROM users WHERE id = ?`)
    .get(id) as UserRow | undefined;
  return row ? mapRow(row) : null;
}

export function findUserByUsername(
  username: string,
): (SafeUser & { passwordHash: string }) | null {
  const db = getSqlite();
  const row = db
    .prepare(
      `SELECT ${SELECT_COLUMNS} FROM users WHERE username = ? COLLATE NOCASE`,
    )
    .get(username.trim()) as UserRow | undefined;
  return row ? mapRow(row) : null;
}

export function findUserByEmail(
  email: string,
): (SafeUser & { passwordHash: string }) | null {
  const db = getSqlite();
  const row = db
    .prepare(
      `SELECT ${SELECT_COLUMNS} FROM users WHERE email = ? COLLATE NOCASE`,
    )
    .get(email.trim()) as UserRow | undefined;
  return row ? mapRow(row) : null;
}

export function createUser(input: {
  username: string;
  passwordHash: string;
  email: string;
  displayName: string;
  role?: UserRole;
  avatarUrl?: string | null;
  balanceCents?: number;
}): SafeUser {
  const db = getSqlite();
  const now = new Date().toISOString();
  const balance = input.balanceCents ?? 0;
  const result = db
    .prepare(
      `INSERT INTO users (username, password_hash, email, display_name, avatar_url, role, balance_cents, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.username.trim(),
      input.passwordHash,
      input.email.trim().toLowerCase(),
      input.displayName.trim(),
      input.avatarUrl ?? null,
      input.role ?? ROLES.USER,
      balance,
      now,
      now,
    );

  const created = findUserById(Number(result.lastInsertRowid));
  if (!created) throw new Error('Failed to create user');
  return toSafeUser(created);
}

export function updateUser(
  id: number,
  fields: Partial<{
    email: string;
    displayName: string;
    avatarUrl: string | null;
    passwordHash: string;
  }>,
): SafeUser | null {
  const existing = findUserById(id);
  if (!existing) return null;

  const db = getSqlite();
  const now = new Date().toISOString();

  db.prepare(
    `UPDATE users SET
      email = ?,
      display_name = ?,
      avatar_url = ?,
      password_hash = ?,
      updated_at = ?
     WHERE id = ?`,
  ).run(
    fields.email?.trim().toLowerCase() ?? existing.email,
    fields.displayName?.trim() ?? existing.displayName,
    fields.avatarUrl !== undefined ? fields.avatarUrl : existing.avatarUrl,
    fields.passwordHash ?? existing.passwordHash,
    now,
    id,
  );

  const updated = findUserById(id);
  return updated ? toSafeUser(updated) : null;
}

export function adminUpdateUser(
  id: number,
  fields: Partial<{
    email: string;
    displayName: string;
    role: UserRole;
    avatarUrl: string | null;
  }>,
): SafeUser | null {
  const existing = findUserById(id);
  if (!existing) return null;

  const db = getSqlite();
  const now = new Date().toISOString();

  db.prepare(
    `UPDATE users SET
      email = ?,
      display_name = ?,
      role = ?,
      avatar_url = ?,
      updated_at = ?
     WHERE id = ?`,
  ).run(
    fields.email?.trim().toLowerCase() ?? existing.email,
    fields.displayName?.trim() ?? existing.displayName,
    fields.role ?? existing.role,
    fields.avatarUrl !== undefined ? fields.avatarUrl : existing.avatarUrl,
    now,
    id,
  );

  const updated = findUserById(id);
  return updated ? toSafeUser(updated) : null;
}

export function setUserBalance(id: number, balanceCents: number): SafeUser | null {
  const existing = findUserById(id);
  if (!existing) return null;

  const db = getSqlite();
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE users SET balance_cents = ?, updated_at = ? WHERE id = ?`,
  ).run(balanceCents, now, id);

  const updated = findUserById(id);
  return updated ? toSafeUser(updated) : null;
}

export function adjustUserBalance(
  id: number,
  adjustCents: number,
): SafeUser | null {
  const existing = findUserById(id);
  if (!existing) return null;

  const next = existing.balanceCents + adjustCents;
  if (next < 0) return null;

  return setUserBalance(id, next);
}

/** Deduct from balance only if the user has enough funds. Returns null on insufficient funds. */
export function debitUserBalance(
  id: number,
  amountCents: number,
): (SafeUser & { passwordHash: string }) | null {
  if (amountCents <= 0 || !Number.isInteger(amountCents)) return null;

  const db = getSqlite();
  const now = new Date().toISOString();
  const result = db
    .prepare(
      `UPDATE users SET balance_cents = balance_cents - ?, updated_at = ?
       WHERE id = ? AND balance_cents >= ?`,
    )
    .run(amountCents, now, id, amountCents);

  if (result.changes === 0) return null;

  return findUserById(id);
}

export function deleteUser(id: number): boolean {
  const db = getSqlite();
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
  return result.changes > 0;
}

export function countUsers(): number {
  const db = getSqlite();
  const row = db.prepare('SELECT COUNT(*) AS count FROM users').get() as {
    count: number;
  };
  return row.count;
}

export function listUsers(): SafeUser[] {
  const db = getSqlite();
  const rows = db
    .prepare(`SELECT ${SELECT_COLUMNS} FROM users ORDER BY id`)
    .all() as UserRow[];
  return rows.map((r) => toSafeUser(mapRow(r)));
}
