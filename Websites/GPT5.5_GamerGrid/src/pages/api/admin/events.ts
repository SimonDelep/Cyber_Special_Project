import type { APIRoute } from 'astro';
import { requireAdminApi } from '@/lib/auth/guards';
import { errorResponse, jsonResponse } from '@/lib/http';
import { listSystemEvents } from '@/lib/monitoring';
import { eventCategories, eventSeverities, eventStatuses } from '@/lib/monitoring/types';

function pickEnum<T extends string>(
  value: string | null,
  allowed: readonly T[],
): T | undefined {
  if (!value) return undefined;
  return allowed.includes(value as T) ? (value as T) : undefined;
}

export const GET: APIRoute = async (context) => {
  const admin = requireAdminApi(context);
  if (admin instanceof Response) return admin;

  const { url } = context;
  const category = pickEnum(url.searchParams.get('category'), eventCategories);
  const severity = pickEnum(url.searchParams.get('severity'), eventSeverities);
  const status = pickEnum(url.searchParams.get('status'), eventStatuses);

  const invalidCategory = url.searchParams.get('category') && !category;
  const invalidSeverity = url.searchParams.get('severity') && !severity;
  const invalidStatus = url.searchParams.get('status') && !status;

  if (invalidCategory || invalidSeverity || invalidStatus) {
    return errorResponse('Invalid filter parameter.', 400);
  }

  const limit = parseInt(url.searchParams.get('limit') ?? '50', 10);
  const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);

  const result = await listSystemEvents({
    category,
    severity,
    status,
    action: url.searchParams.get('action') ?? undefined,
    search: url.searchParams.get('q') ?? undefined,
    limit: Number.isFinite(limit) ? limit : 50,
    offset: Number.isFinite(offset) ? offset : 0,
  });

  return jsonResponse(result);
};
