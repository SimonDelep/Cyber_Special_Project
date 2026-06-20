import type { APIRoute } from 'astro';
import { getAdminFromCookies } from '../../../lib/api/admin-guard';
import { listSystemEvents } from '../../../lib/db/system-events';
import { EVENT_CATEGORY, EVENT_OUTCOME } from '../../../lib/events/constants';
import { jsonResponse } from '../../../lib/api/response';

const CATEGORIES = new Set(Object.values(EVENT_CATEGORY));
const OUTCOMES = new Set(Object.values(EVENT_OUTCOME));

export const GET: APIRoute = async ({ url, cookies }) => {
  const admin = getAdminFromCookies(cookies);
  if (admin instanceof Response) return admin;

  const limit = Number.parseInt(url.searchParams.get('limit') ?? '100', 10);
  const category = url.searchParams.get('category') ?? undefined;
  const action = url.searchParams.get('action') ?? undefined;
  const outcome = url.searchParams.get('outcome') ?? undefined;
  const userId = Number.parseInt(url.searchParams.get('userId') ?? '', 10);
  const since = url.searchParams.get('since') ?? undefined;

  if (category && !CATEGORIES.has(category as (typeof EVENT_CATEGORY)[keyof typeof EVENT_CATEGORY])) {
    return jsonResponse({ events: [] });
  }
  if (outcome && !OUTCOMES.has(outcome as (typeof EVENT_OUTCOME)[keyof typeof EVENT_OUTCOME])) {
    return jsonResponse({ events: [] });
  }

  const events = listSystemEvents({
    limit: Number.isInteger(limit) ? limit : 100,
    category,
    action,
    outcome,
    userId: Number.isInteger(userId) && userId > 0 ? userId : undefined,
    since: since || undefined,
  });

  return jsonResponse({ events });
};
