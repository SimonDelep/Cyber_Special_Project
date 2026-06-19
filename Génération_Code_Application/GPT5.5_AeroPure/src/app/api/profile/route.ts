import { prisma } from "@/lib/prisma";
import { LogCategory, LogLevel } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { profileUpdateSchema } from "@/lib/auth/validation";
import { isValidProfilePictureUrl } from "@/lib/auth/avatar";
import { jsonError, jsonSuccess } from "@/lib/auth/api";
import { logEvent } from "@/lib/logging/logger";
import { LOG_ACTIONS } from "@/lib/logging/actions";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      firstName: true,
      lastName: true,
      bio: true,
      profilePicture: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!profile) return jsonError("User not found", 404);

  return jsonSuccess({ profile });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);

  try {
    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid input";
      return jsonError(message, 400);
    }

    const { email, firstName, lastName, bio, profilePictureUrl } = parsed.data;

    const emailTaken = await prisma.user.findFirst({
      where: { email, NOT: { id: user.id } },
    });

    if (emailTaken) {
      return jsonError("Email already in use", 409);
    }

    let profilePicture: string | null | undefined = undefined;

    if (profilePictureUrl !== undefined) {
      if (profilePictureUrl === "") {
        profilePicture = null;
      } else if (!isValidProfilePictureUrl(profilePictureUrl)) {
        return jsonError("Invalid profile picture URL", 400);
      } else {
        profilePicture = profilePictureUrl;
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        email,
        firstName: firstName || null,
        lastName: lastName || null,
        bio: bio || null,
        ...(profilePicture !== undefined && { profilePicture }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        bio: true,
        profilePicture: true,
        updatedAt: true,
      },
    });

    await logEvent({
      level: LogLevel.INFO,
      category: LogCategory.PROFILE,
      action: LOG_ACTIONS.PROFILE_UPDATE,
      message: `Profile updated for "${user.username}"`,
      userId: user.id,
      username: user.username,
      metadata: { email: updated.email },
      request,
    });

    return jsonSuccess({ profile: updated, message: "Profile updated" });
  } catch {
    return jsonError("Failed to update profile", 500);
  }
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);

  try {
    await logEvent({
      level: LogLevel.WARN,
      category: LogCategory.PROFILE,
      action: LOG_ACTIONS.PROFILE_DELETE,
      message: `Account deleted: "${user.username}"`,
      userId: user.id,
      username: user.username,
      request,
    });

    await prisma.user.delete({ where: { id: user.id } });
    const { destroySession } = await import("@/lib/auth/session");
    await destroySession();
    return jsonSuccess({ message: "Account deleted successfully" });
  } catch {
    return jsonError("Failed to delete account", 500);
  }
}
