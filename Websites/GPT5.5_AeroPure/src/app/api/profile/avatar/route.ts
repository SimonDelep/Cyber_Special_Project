import { prisma } from "@/lib/prisma";
import { LogCategory, LogLevel } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { saveAvatarFile } from "@/lib/auth/avatar";
import { jsonError, jsonSuccess } from "@/lib/auth/api";
import { logEvent } from "@/lib/logging/logger";
import { LOG_ACTIONS } from "@/lib/logging/actions";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);

  try {
    const formData = await request.formData();
    const file = formData.get("avatar");

    if (!file || !(file instanceof File)) {
      return jsonError("No image file provided", 400);
    }

    const profilePicture = await saveAvatarFile(user.id, file);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { profilePicture },
      select: {
        id: true,
        profilePicture: true,
      },
    });

    await logEvent({
      level: LogLevel.INFO,
      category: LogCategory.PROFILE,
      action: LOG_ACTIONS.PROFILE_AVATAR_UPLOAD,
      message: `Profile picture uploaded for "${user.username}"`,
      userId: user.id,
      username: user.username,
      request,
    });

    return jsonSuccess({
      profilePicture: updated.profilePicture,
      message: "Profile picture uploaded",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upload failed";
    return jsonError(message, 400);
  }
}
