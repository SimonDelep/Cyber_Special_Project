import type { APIRoute } from "astro";
import { AuditEvent, logSystemEvent } from "@/lib/audit";
import { destroySession, resolveAuthUser } from "@/lib/auth";

export const POST: APIRoute = async ({ request, locals, cookies, redirect }) => {
  const user = resolveAuthUser(locals, cookies);
  destroySession(cookies);
  logSystemEvent({
    eventType: AuditEvent.AUTH_LOGOUT,
    category: "auth",
    outcome: "info",
    message: user
      ? `User @${user.username} signed out.`
      : "Sign-out requested (no active session).",
    actorUserId: user?.id ?? null,
    actorUsername: user?.username ?? null,
    request,
  });
  return redirect("/?success=logged_out");
};
