import { getSqlite } from './client';

export type SystemEvent = {
  id: number;
  category: string;
  action: string;
  outcome: string;
  userId: number | null;
  username: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestPath: string | null;
  requestMethod: string | null;
  message: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

type EventRow = {
  id: number;
  category: string;
  action: string;
  outcome: string;
  user_id: number | null;
  username: string | null;
  ip_address: string | null;
  user_agent: string | null;
  request_path: string | null;
  request_method: string | null;
  message: string;
  metadata: string | null;
  created_at: string;
};

function mapRow(row: EventRow): SystemEvent {
  let metadata: Record<string, unknown> | null = null;
  if (row.metadata) {
    try {
      metadata = JSON.parse(row.metadata) as Record<string, unknown>;
    } catch {
      metadata = null;
    }
  }
  return {
    id: row.id,
    category: row.category,
    action: row.action,
    outcome: row.outcome,
    userId: row.user_id,
    username: row.username,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    requestPath: row.request_path,
    requestMethod: row.request_method,
    message: row.message,
    metadata,
    createdAt: row.created_at,
  };
}

export function insertSystemEvent(input: {
  category: string;
  action: string;
  outcome: string;
  message: string;
  userId?: number | null;
  username?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestPath?: string | null;
  requestMethod?: string | null;
  metadata?: Record<string, unknown> | null;
}): SystemEvent {
  const db = getSqlite();
  const now = new Date().toISOString();
  const metadataJson = input.metadata ? JSON.stringify(input.metadata) : null;

  const result = db
    .prepare(
      `INSERT INTO system_events (
        category, action, outcome, user_id, username,
        ip_address, user_agent, request_path, request_method,
        message, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.category,
      input.action,
      input.outcome,
      input.userId ?? null,
      input.username ?? null,
      input.ipAddress ?? null,
      input.userAgent ?? null,
      input.requestPath ?? null,
      input.requestMethod ?? null,
      input.message,
      metadataJson,
      now,
    );

  const row = db
    .prepare('SELECT * FROM system_events WHERE id = ?')
    .get(Number(result.lastInsertRowid)) as EventRow;

  return mapRow(row);
}

export type SystemEventFilters = {
  limit?: number;
  category?: string;
  action?: string;
  outcome?: string;
  userId?: number;
  since?: string;
};

export function listSystemEvents(
  filters: SystemEventFilters = {},
): SystemEvent[] {
  const db = getSqlite();
  const limit = Math.min(Math.max(filters.limit ?? 100, 1), 500);
  const conditions: string[] = [];
  const params: Array<string | number> = [];

  if (filters.category) {
    conditions.push('category = ?');
    params.push(filters.category);
  }
  if (filters.action) {
    conditions.push('action = ?');
    params.push(filters.action);
  }
  if (filters.outcome) {
    conditions.push('outcome = ?');
    params.push(filters.outcome);
  }
  if (filters.userId) {
    conditions.push('user_id = ?');
    params.push(filters.userId);
  }
  if (filters.since) {
    conditions.push('created_at >= ?');
    params.push(filters.since);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = db
    .prepare(
      `SELECT * FROM system_events ${where} ORDER BY id DESC LIMIT ?`,
    )
    .all(...params, limit) as EventRow[];

  return rows.map(mapRow);
}

export function countSystemEvents(filters: Omit<SystemEventFilters, 'limit'> = {}): number {
  const db = getSqlite();
  const conditions: string[] = [];
  const params: Array<string | number> = [];

  if (filters.category) {
    conditions.push('category = ?');
    params.push(filters.category);
  }
  if (filters.outcome) {
    conditions.push('outcome = ?');
    params.push(filters.outcome);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const row = db
    .prepare(`SELECT COUNT(*) AS count FROM system_events ${where}`)
    .get(...params) as { count: number };
  return row.count;
}
