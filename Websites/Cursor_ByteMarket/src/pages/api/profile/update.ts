import type { APIRoute } from "astro";
import { AuditEvent, logSystemEvent } from "@/lib/audit";
import { resolveAuthUser, updateUserProfile } from "@/lib/auth";
import { pathWithMessage, readFormString } from "@/lib/http";

export const POST: APIRoute = async ({ request, locals, cookies, redirect }) => {
  const user = resolveAuthUser(locals, cookies);
  if (!user) {
    return redirect(pathWithMessage("/login", "error", "You must be signed in."));
  }

  const formData = await request.formData();
  const displayName = await readFormString(formData, "display_name");
  const email = await readFormString(formData, "email");
  const currentPassword = await readFormString(formData, "current_password");
  const newPassword = await readFormString(formData, "new_password");

  const result = updateUserProfile(user.id, {
    displayName,
    email,
    currentPassword: currentPassword || undefined,
    newPassword: newPassword || undefined,
  });

  if (result.error) {
    logSystemEvent({
      eventType: AuditEvent.PROFILE_UPDATE_FAILURE,
      category: "profile",
      outcome: "failure",
      message: `Profile update failed for @${user.username}.`,
      actorUserId: user.id,
      actorUsername: user.username,
      metadata: { reason: result.error },
      request,
    });
    return redirect(pathWithMessage("/profile", "error", result.error));
  }

  logSystemEvent({
    eventType: AuditEvent.PROFILE_UPDATE_SUCCESS,
    category: "profile",
    outcome: "success",
    message: `Profile updated for @${user.username}.`,
    actorUserId: user.id,
    actorUsername: user.username,
    metadata: {
      passwordChanged: Boolean(newPassword.trim()),
      emailProvided: Boolean(email.trim()),
    },
    request,
  });

  return redirect(
    pathWithMessage("/profile", "success", "Profile updated successfully."),
  );
};
