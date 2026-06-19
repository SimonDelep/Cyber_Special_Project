import { AuditAction } from "@/lib/audit/actions";
import { logEvent } from "@/lib/audit/logger";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { destroySession, getSessionUser } from "@/lib/auth/session";
import { validateImageUrl } from "@/lib/auth/avatar";
import { formatZodErrors, profileDeleteSchema, profileUpdateSchema } from "@/lib/auth/validation";
import { jsonError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("Not authenticated", 401);
  return jsonOk({ user });
}

export async function PATCH(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return jsonError("Not authenticated", 401);

  const body = await request.json();
  const parsed = profileUpdateSchema.safeParse(body);

  if (!parsed.success) {
    await logEvent({
      category: "PROFILE",
      action: AuditAction.PROFILE_UPDATE,
      status: "FAILURE",
      message: "Profile update failed: invalid input",
      userId: sessionUser.id,
      username: sessionUser.username,
      request,
      metadata: { reason: "validation" },
    });
    return jsonError(formatZodErrors(parsed.error));
  }

  const { displayName, email, profileImageUrl, currentPassword, newPassword } =
    parsed.data;

  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user) return jsonError("User not found", 404);

  if (newPassword) {
    if (!currentPassword) {
      await logEvent({
        category: "PROFILE",
        action: AuditAction.PROFILE_UPDATE,
        status: "FAILURE",
        message: "Profile update failed: missing current password",
        userId: user.id,
        username: user.username,
        request,
        metadata: { reason: "missing_current_password" },
      });
      return jsonError("Current password is required to set a new password");
    }
    if (!(await verifyPassword(currentPassword, user.passwordHash))) {
      await logEvent({
        category: "PROFILE",
        action: AuditAction.PROFILE_UPDATE,
        status: "FAILURE",
        message: "Profile update failed: incorrect current password",
        userId: user.id,
        username: user.username,
        request,
        metadata: { reason: "wrong_password" },
      });
      return jsonError("Current password is incorrect", 401);
    }
  }

  if (email && email !== user.email) {
    const emailTaken = await prisma.user.findFirst({
      where: { email, NOT: { id: user.id } },
    });
    if (emailTaken) {
      await logEvent({
        category: "PROFILE",
        action: AuditAction.PROFILE_UPDATE,
        status: "FAILURE",
        message: "Profile update failed: email already in use",
        userId: user.id,
        username: user.username,
        request,
        metadata: { reason: "email_taken" },
      });
      return jsonError("Email is already in use", 409);
    }
  }

  if (profileImageUrl) {
    const urlError = validateImageUrl(profileImageUrl);
    if (urlError) {
      await logEvent({
        category: "PROFILE",
        action: AuditAction.PROFILE_UPDATE,
        status: "FAILURE",
        message: "Profile update failed: invalid image URL",
        userId: user.id,
        username: user.username,
        request,
        metadata: { reason: "invalid_image_url" },
      });
      return jsonError(urlError);
    }
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      displayName: displayName === undefined ? undefined : displayName || null,
      email: email === undefined ? undefined : email || null,
      profileImageUrl:
        profileImageUrl === undefined ? undefined : profileImageUrl || null,
      ...(newPassword ? { passwordHash: await hashPassword(newPassword) } : {}),
    },
  });

  await logEvent({
    category: "PROFILE",
    action: AuditAction.PROFILE_UPDATE,
    status: "SUCCESS",
    message: `Profile updated for "${user.username}"`,
    userId: user.id,
    username: user.username,
    request,
    metadata: {
      fields: {
        displayName: displayName !== undefined,
        email: email !== undefined,
        profileImageUrl: profileImageUrl !== undefined,
        password: Boolean(newPassword),
      },
    },
  });

  const { passwordHash: _, ...safeUser } = updated;
  return jsonOk({ user: safeUser });
}

export async function DELETE(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return jsonError("Not authenticated", 401);

  const body = await request.json();
  const parsed = profileDeleteSchema.safeParse(body);

  if (!parsed.success) {
    await logEvent({
      category: "PROFILE",
      action: AuditAction.PROFILE_DELETE,
      status: "FAILURE",
      message: "Account deletion failed: invalid input",
      userId: sessionUser.id,
      username: sessionUser.username,
      request,
      metadata: { reason: "validation" },
    });
    return jsonError(formatZodErrors(parsed.error));
  }

  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user) return jsonError("User not found", 404);

  if (!(await verifyPassword(parsed.data.password, user.passwordHash))) {
    await logEvent({
      category: "PROFILE",
      action: AuditAction.PROFILE_DELETE,
      status: "FAILURE",
      message: `Account deletion failed: wrong password for "${user.username}"`,
      userId: user.id,
      username: user.username,
      request,
      metadata: { reason: "wrong_password" },
    });
    return jsonError("Password is incorrect", 401);
  }

  await prisma.user.delete({ where: { id: user.id } });
  await destroySession();

  await logEvent({
    category: "PROFILE",
    action: AuditAction.PROFILE_DELETE,
    status: "SUCCESS",
    message: `Account deleted: "${user.username}"`,
    username: user.username,
    request,
    metadata: { deletedUserId: user.id },
  });

  return jsonOk({ success: true });
}
