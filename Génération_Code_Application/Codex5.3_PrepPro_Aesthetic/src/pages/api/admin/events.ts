import type { APIRoute } from "astro";
import { requireAdminApi } from "@/lib/admin/guard";
import { countRecentFailures, listSystemEvents } from "@/db/events";
import { eventStatuses, eventTypes } from "@/lib/monitoring/types";
import { errorResponse, jsonResponse } from "@/lib/api/response";

export const GET: APIRoute = ({ locals, url }) => {
  const admin = requireAdminApi(locals);
  if (admin instanceof Response) return admin;

  const eventType = url.searchParams.get("eventType") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;
  const userIdParam = url.searchParams.get("userId");
  const limitParam = url.searchParams.get("limit");
  const offsetParam = url.searchParams.get("offset");

  if (eventType && !eventTypes.includes(eventType as never)) {
    return errorResponse("Invalid event type filter.", 400);
  }
  if (status && !eventStatuses.includes(status as never)) {
    return errorResponse("Invalid status filter.", 400);
  }

  const userId = userIdParam ? Number.parseInt(userIdParam, 10) : undefined;
  if (userIdParam && (!userId || userId < 1)) {
    return errorResponse("Invalid user id filter.", 400);
  }

  const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;
  const offset = offsetParam ? Number.parseInt(offsetParam, 10) : undefined;

  const { events, total } = listSystemEvents({
    eventType,
    status,
    userId,
    limit,
    offset,
  });

  const since = new Date();
  since.setHours(since.getHours() - 24);
  const failures24h = countRecentFailures(since.toISOString());

  return jsonResponse({
    events,
    total,
    stats: { failures24h },
  });
};
