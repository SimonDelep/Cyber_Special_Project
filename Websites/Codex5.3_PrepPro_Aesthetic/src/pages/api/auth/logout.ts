import type { APIRoute } from "astro";
import {
  destroySessionCookie,
  getSessionTokenFromCookies,
  resolveUserFromCookies,
  revokeSession,
} from "@/lib/auth/session";
import { jsonResponse } from "@/lib/api/response";
import { logEventFromRequest } from "@/lib/monitoring/logger";

export const POST: APIRoute = async ({ cookies, request, redirect }) => {
  const user = resolveUserFromCookies(cookies);
  const token = getSessionTokenFromCookies(cookies);
  revokeSession(token);
  destroySessionCookie(cookies);

  logEventFromRequest(request, {
    eventType: "auth.logout",
    status: "info",
    userId: user?.id ?? null,
    actorLabel: user?.username ?? "anonymous",
    message: user
      ? `User ${user.username} signed out.`
      : "Logout requested with no active session.",
  });

  const accept = request.headers.get("accept") ?? "";
  const wantsJson =
    accept.includes("application/json") ||
    request.headers.get("x-requested-with") === "XMLHttpRequest";

  if (wantsJson) {
    return jsonResponse({ ok: true });
  }

  return redirect("/");
};
