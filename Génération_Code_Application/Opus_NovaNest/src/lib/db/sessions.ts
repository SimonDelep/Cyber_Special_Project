import { randomBytes } from 'node:crypto';
import { getSqlite } from './client';
import { findUserById, toSafeUser } from './users';
import type { SafeUser } from './schema';
import { SESSION_MAX_AGE_MS } from '../auth/constants';

type SessionRow = {
  id: string;
  user_id: number;
  expires_at: string;
  created_at: string;
};

export function createSession(userId: number): { id: string; expiresAt: string } {
  const db = getSqlite();
  const id = randomBytes(32).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE_MS).toISOString();
  const createdAt = now.toISOString();

  db.prepare(
    `INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)`,
  ).run(id, userId, expiresAt, createdAt);

  return { id, expiresAt };
}

export function getSessionUser(sessionId: string): SafeUser | null {
  const db = getSqlite();
  const row = db
    .prepare(
      `SELECT id, user_id, expires_at, created_at FROM sessions WHERE id = ?`,
    )
    .get(sessionId) as SessionRow | undefined;

  if (!row) return null;

  if (new Date(row.expires_at) <= new Date()) {
    deleteSession(sessionId);
    return null;
  }

  const user = findUserById(row.user_id);
  return user ? toSafeUser(user) : null;
}

export function deleteSession(sessionId: string): void {
  const db = getSqlite();
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
}

export function deleteSessionsForUser(userId: number): void {
  const db = getSqlite();
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
}

export function purgeExpiredSessions(): void {
  const db = getSqlite();
  db.prepare(`DELETE FROM sessions WHERE expires_at <= ?`).run(
    new Date().toISOString(),
  );
}
