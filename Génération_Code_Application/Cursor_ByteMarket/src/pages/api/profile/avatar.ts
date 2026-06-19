import type { APIRoute } from "astro";
import { AuditEvent, logSystemEvent } from "@/lib/audit";
import {
  clearUserAvatar,
  resolveAuthUser,
  updateUserAvatar,
} from "@/lib/auth";
import { saveAvatarFile } from "@/lib/avatar";
import { pathWithMessage, readFormString } from "@/lib/http";

export const POST: APIRoute = async ({ request, locals, cookies, redirect }) => {
  const user = resolveAuthUser(locals, cookies);
  if (!user) {
    return redirect(pathWithMessage("/login", "error", "You must be signed in."));
  }

  const formData = await request.formData();
  const action = await readFormString(formData, "action");

  if (action === "remove") {
    const result = clearUserAvatar(user.id);
    if (result.error) {
      return redirect(pathWithMessage("/profile", "error", result.error));
    }
    logSystemEvent({
      eventType: AuditEvent.PROFILE_AVATAR_REMOVE,
      category: "profile",
      outcome: "success",
      message: `Avatar removed for @${user.username}.`,
      actorUserId: user.id,
      actorUsername: user.username,
      request,
    });
    return redirect(
      pathWithMessage("/profile", "success", "Profile picture removed."),
    );
  }

  const avatarFile = formData.get("avatar_file");
  if (avatarFile instanceof File && avatarFile.size > 0) {
    const saved = await saveAvatarFile(user.id, avatarFile);
    if (saved.error) {
      return redirect(pathWithMessage("/profile", "error", saved.error));
    }

    const result = updateUserAvatar(user.id, saved.url!);
    if (result.error) {
      return redirect(pathWithMessage("/profile", "error", result.error));
    }

    logSystemEvent({
      eventType: AuditEvent.PROFILE_AVATAR_UPDATE,
      category: "profile",
      outcome: "success",
      message: `Avatar uploaded for @${user.username}.`,
      actorUserId: user.id,
      actorUsername: user.username,
      metadata: { source: "file" },
      request,
    });

    return redirect(
      pathWithMessage("/profile", "success", "Profile picture uploaded."),
    );
  }

  const avatarUrl = await readFormString(formData, "avatar_url");
  if (!avatarUrl.trim()) {
    return redirect(
      pathWithMessage("/profile", "error", "Enter an image URL or choose a file."),
    );
  }

  const result = updateUserAvatar(user.id, avatarUrl.trim());
  if (result.error) {
    return redirect(pathWithMessage("/profile", "error", result.error));
  }

  logSystemEvent({
    eventType: AuditEvent.PROFILE_AVATAR_UPDATE,
    category: "profile",
    outcome: "success",
    message: `Avatar updated from URL for @${user.username}.`,
    actorUserId: user.id,
    actorUsername: user.username,
    metadata: { source: "url" },
    request,
  });

  return redirect(
    pathWithMessage("/profile", "success", "Profile picture updated from URL."),
  );
};
