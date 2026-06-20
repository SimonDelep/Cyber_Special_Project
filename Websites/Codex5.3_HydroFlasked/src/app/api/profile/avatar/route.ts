import { AuditAction } from "@/lib/audit/actions";
import { logEvent } from "@/lib/audit/logger";
import { getSessionUser } from "@/lib/auth/session";
import { saveAvatarFile, validateAvatarFile } from "@/lib/auth/avatar";
import { jsonError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return jsonError("Not authenticated", 401);

  const formData = await request.formData();
  const file = formData.get("avatar");

  if (!file || !(file instanceof File)) {
    await logEvent({
      category: "PROFILE",
      action: AuditAction.PROFILE_AVATAR_UPLOAD,
      status: "FAILURE",
      message: "Avatar upload failed: no file",
      userId: sessionUser.id,
      username: sessionUser.username,
      request,
    });
    return jsonError("No image file provided");
  }

  const validationError = validateAvatarFile(file);
  if (validationError) {
    await logEvent({
      category: "PROFILE",
      action: AuditAction.PROFILE_AVATAR_UPLOAD,
      status: "FAILURE",
      message: `Avatar upload failed: ${validationError}`,
      userId: sessionUser.id,
      username: sessionUser.username,
      request,
    });
    return jsonError(validationError);
  }

  const profileImageUrl = await saveAvatarFile(sessionUser.id, file);

  const updated = await prisma.user.update({
    where: { id: sessionUser.id },
    data: { profileImageUrl },
  });

  await logEvent({
    category: "PROFILE",
    action: AuditAction.PROFILE_AVATAR_UPLOAD,
    status: "SUCCESS",
    message: `Avatar uploaded for "${sessionUser.username}"`,
    userId: sessionUser.id,
    username: sessionUser.username,
    request,
    metadata: { profileImageUrl },
  });

  const { passwordHash: _, ...safeUser } = updated;
  return jsonOk({ user: safeUser, profileImageUrl });
}
