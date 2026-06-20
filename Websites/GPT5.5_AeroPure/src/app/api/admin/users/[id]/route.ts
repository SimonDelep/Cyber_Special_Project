import { prisma } from "@/lib/prisma";
import { Role, LogCategory, LogLevel } from "@prisma/client";
import { requireAdminApi } from "@/lib/auth/admin-guard";
import { adminUserUpdateSchema } from "@/lib/admin/validation";
import { jsonError, jsonSuccess } from "@/lib/auth/api";
import { logEvent } from "@/lib/logging/logger";
import { LOG_ACTIONS } from "@/lib/logging/actions";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireAdminApi();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      balance: true,
      firstName: true,
      lastName: true,
      bio: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) return jsonError("User not found", 404);

  return jsonSuccess({
    user: { ...user, balance: Number(user.balance) },
  });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireAdminApi();
  if ("response" in auth) return auth.response;

  const { id } = await params;

  if (id === auth.user.id && auth.user.role === Role.ADMIN) {
    // allow self-edit but role change handled below
  }

  try {
    const body = await request.json();
    const parsed = adminUserUpdateSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid input";
      return jsonError(message, 400);
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return jsonError("User not found", 404);

    const { email, firstName, lastName, role, balance } = parsed.data;

    if (role !== Role.ADMIN && target.role === Role.ADMIN) {
      const adminCount = await prisma.user.count({
        where: { role: Role.ADMIN },
      });
      if (adminCount <= 1) {
        return jsonError("Cannot demote the last administrator", 400);
      }
    }

    const emailTaken = await prisma.user.findFirst({
      where: { email, NOT: { id } },
    });
    if (emailTaken) return jsonError("Email already in use", 409);

    const updated = await prisma.user.update({
      where: { id },
      data: {
        email,
        firstName: firstName || null,
        lastName: lastName || null,
        role,
        balance,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        balance: true,
        firstName: true,
        lastName: true,
        updatedAt: true,
      },
    });

    await logEvent({
      level: LogLevel.INFO,
      category: LogCategory.ADMIN,
      action: LOG_ACTIONS.ADMIN_USER_UPDATE,
      message: `Admin "${auth.user.username}" updated user "${updated.username}"`,
      userId: auth.user.id,
      username: auth.user.username,
      metadata: {
        targetUserId: id,
        targetUsername: updated.username,
        role: updated.role,
        balance: Number(updated.balance),
      },
      request,
    });

    return jsonSuccess({
      user: { ...updated, balance: Number(updated.balance) },
      message: "User updated",
    });
  } catch {
    return jsonError("Failed to update user", 500);
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const auth = await requireAdminApi();
  if ("response" in auth) return auth.response;

  const { id } = await params;

  if (id === auth.user.id) {
    return jsonError("You cannot delete your own account from the admin panel", 400);
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return jsonError("User not found", 404);

  if (target.role === Role.ADMIN) {
    const adminCount = await prisma.user.count({
      where: { role: Role.ADMIN },
    });
    if (adminCount <= 1) {
      return jsonError("Cannot delete the last administrator", 400);
    }
  }

  await prisma.user.delete({ where: { id } });

  await logEvent({
    level: LogLevel.WARN,
    category: LogCategory.ADMIN,
    action: LOG_ACTIONS.ADMIN_USER_DELETE,
    message: `Admin "${auth.user.username}" deleted user "${target.username}"`,
    userId: auth.user.id,
    username: auth.user.username,
    metadata: { targetUserId: id, targetUsername: target.username },
    request,
  });

  return jsonSuccess({ message: "User deleted" });
}
