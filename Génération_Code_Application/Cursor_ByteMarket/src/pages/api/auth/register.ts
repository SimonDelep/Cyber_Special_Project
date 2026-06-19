import type { APIRoute } from "astro";
import { AuditEvent, logSystemEvent } from "@/lib/audit";
import { createSession, registerUser } from "@/lib/auth";
import { pathWithMessage, readFormString } from "@/lib/http";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();
  const username = await readFormString(formData, "username");
  const password = await readFormString(formData, "password");
  const displayName = await readFormString(formData, "display_name");
  const email = await readFormString(formData, "email");

  const result = registerUser({
    username,
    password,
    displayName: displayName || undefined,
    email: email || undefined,
  });

  if (result.error || !result.user) {
    logSystemEvent({
      eventType: AuditEvent.AUTH_REGISTER_FAILURE,
      category: "auth",
      outcome: "failure",
      message: `Registration failed for "${username.trim() || "(empty)"}".`,
      actorUsername: username.trim() || null,
      metadata: { reason: result.error ?? "Registration failed." },
      request,
    });
    return redirect(
      pathWithMessage("/register", "error", result.error ?? "Registration failed."),
    );
  }

  createSession(result.user.id, cookies);
  logSystemEvent({
    eventType: AuditEvent.AUTH_REGISTER_SUCCESS,
    category: "auth",
    outcome: "success",
    message: `New account registered: @${result.user.username}.`,
    actorUserId: result.user.id,
    actorUsername: result.user.username,
    request,
  });
  return redirect(
    pathWithMessage("/profile", "success", "Account created successfully."),
  );
};
