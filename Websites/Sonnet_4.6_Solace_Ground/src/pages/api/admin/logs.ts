import type { APIRoute } from 'astro';
import { and, desc, eq, like, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { systemLogs, LOG_CATEGORIES, LOG_STATUSES } from '@/db/schema';
import { requireAdminApi, isAdminResponse } from '@/lib/admin/guard';
import { toPublicSystemLog } from '@/lib/monitoring/logger';
import { jsonResponse } from '@/lib/api';
import type { LogCategory } from '@/db/schema';

export const prerender = false;

export const GET: APIRoute = ({ url, locals }) => {
  const admin = requireAdminApi(locals);
  if (isAdminResponse(admin)) return admin;

  const category = url.searchParams.get('category');
  const status = url.searchParams.get('status');
  const action = url.searchParams.get('action');
  const limit = Math.min(
    200,
    Math.max(1, Number(url.searchParams.get('limit') ?? 50)),
  );
  const offset = Math.max(0, Number(url.searchParams.get('offset') ?? 0));

  const conditions = [];

  if (category && category !== 'all' && LOG_CATEGORIES.includes(category as LogCategory)) {
    conditions.push(eq(systemLogs.category, category as LogCategory));
  }
  if (status && LOG_STATUSES.includes(status as (typeof LOG_STATUSES)[number])) {
    conditions.push(eq(systemLogs.status, status as (typeof LOG_STATUSES)[number]));
  }
  if (action?.trim()) {
    conditions.push(like(systemLogs.action, `%${action.trim()}%`));
  }

  const db = getDb();
  const where = conditions.length ? and(...conditions) : undefined;

  const logs = db
    .select()
    .from(systemLogs)
    .where(where)
    .orderBy(desc(systemLogs.createdAt))
    .limit(limit)
    .offset(offset)
    .all();

  const countRow = db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(systemLogs)
    .where(where)
    .get();

  return jsonResponse({
    logs: logs.map(toPublicSystemLog),
    total: countRow?.count ?? 0,
    limit,
    offset,
  });
};
