import type { APIContext } from "astro";
import { isAdmin } from "@/lib/auth/rbac";
import { errorResponse } from "@/lib/api/response";
import type { PublicUser } from "@/lib/auth/types";

export function requireAdminApi(
  locals: APIContext["locals"],
): PublicUser | Response {
  if (!locals.user) {
    return errorResponse("Authentication required.", 401);
  }
  if (!isAdmin(locals.user)) {
    return errorResponse("Administrator access required.", 403);
  }
  return locals.user;
}

export function parseIdParam(id: string | undefined): number | null {
  if (!id) return null;
  const n = Number.parseInt(id, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}
