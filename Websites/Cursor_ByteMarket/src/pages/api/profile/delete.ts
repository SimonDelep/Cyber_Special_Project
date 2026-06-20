import type { APIRoute } from "astro";
import { AuditEvent, logSystemEvent } from "@/lib/audit";
import { deleteUserAccount, destroySession, resolveAuthUser } from "@/lib/auth";
import { pathWithMessage, readFormString } from "@/lib/http";

export const POST: APIRoute = async ({ request, locals, cookies, redirect }) => {
  const user = resolveAuthUser(locals, cookies);
  if (!user) {
    return redirect(pathWithMessage("/login", "error", "You must be signed in."));
  }

  const formData = await request.formData();
  const password = await readFormString(formData, "password");
  const confirm = await readFormString(formData, "confirm");

  if (confirm !== "DELETE") {
    logSystemEvent({
      eventType: AuditEvent.PROFILE_DELETE_FAILURE,
      category: "profile",
      outcome: "failure",
      message: `Account deletion aborted for @${user.username} (confirmation mismatch).`,
      actorUserId: user.id,
      actorUsername: user.username,
      request,
    });
    return redirect(
      pathWithMessage(
        "/profile",
        "error",
        'Type DELETE in the confirmation field to delete your account.',
      ),
    );
  }

  const result = deleteUserAccount(user.id, password);
  if (!result.ok) {
    logSystemEvent({
      eventType: AuditEvent.PROFILE_DELETE_FAILURE,
      category: "profile",
      outcome: "failure",
      message: `Account deletion failed for @${user.username}.`,
      actorUserId: user.id,
      actorUsername: user.username,
      metadata: { reason: result.error },
      request,
    });
    return redirect(
      pathWithMessage("/profile", "error", result.error ?? "Could not delete account."),
    );
  }

  logSystemEvent({
    eventType: AuditEvent.PROFILE_DELETE_SUCCESS,
    category: "profile",
    outcome: "success",
    message: `Account deleted: @${user.username}.`,
    actorUserId: user.id,
    actorUsername: user.username,
    request,
  });

  destroySession(cookies);
  return redirect(
    pathWithMessage("/", "success", "Your account has been deleted."),
  );
};
