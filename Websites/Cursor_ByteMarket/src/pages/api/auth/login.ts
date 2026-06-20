import type { APIRoute } from "astro";
import { AuditEvent, logSystemEvent } from "@/lib/audit";
import {
  authenticateUser,
  createSession,
} from "@/lib/auth";
import { pathWithMessage, readFormString, safeRedirectPath } from "@/lib/http";

export const POST: APIRoute = async ({ request, cookies, redirect, url }) => {
  const formData = await request.formData();
  const username = await readFormString(formData, "username");
  const password = await readFormString(formData, "password");
  const redirectTo = safeRedirectPath(
    (await readFormString(formData, "redirect")) || url.searchParams.get("redirect"),
  );

  const result = authenticateUser(username, password);
  if (result.error || !result.user) {
    logSystemEvent({
      eventType: AuditEvent.AUTH_LOGIN_FAILURE,
      category: "auth",
      outcome: "failure",
      message: `Failed login attempt for "${username.trim() || "(empty)"}".`,
      actorUsername: username.trim() || null,
      metadata: { reason: result.error ?? "Login failed." },
      request,
    });
    return redirect(
      pathWithMessage(
        `/login?redirect=${encodeURIComponent(redirectTo)}`,
        "error",
        result.error ?? "Login failed.",
      ),
    );
  }

  createSession(result.user.id, cookies);
  logSystemEvent({
    eventType: AuditEvent.AUTH_LOGIN_SUCCESS,
    category: "auth",
    outcome: "success",
    message: `User @${result.user.username} signed in.`,
    actorUserId: result.user.id,
    actorUsername: result.user.username,
    metadata: { redirectTo },
    request,
  });
  return redirect(redirectTo);
};
