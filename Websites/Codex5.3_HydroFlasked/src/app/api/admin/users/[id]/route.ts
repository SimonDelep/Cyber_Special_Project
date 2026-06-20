import { AuditAction } from "@/lib/audit/actions";
import { logEvent } from "@/lib/audit/logger";
import { requireAdmin } from "@/lib/auth/admin";
import { toAdminUser } from "@/lib/admin/serializers";
import { adminUserUpdateSchema, formatZodErrors } from "@/lib/admin/validation";
import { jsonError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return jsonError("User not found", 404);

  return jsonOk({ user: toAdminUser(user) });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { user: admin, error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const parsed = adminUserUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(formatZodErrors(parsed.error));
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return jsonError("User not found", 404);

    const { displayName, email, role, profileImageUrl, balanceCents } = parsed.data;

    if (role === "USER" && target.role === "ADMIN" && target.id === admin.id) {
      return jsonError("You cannot remove your own admin role", 400);
    }

    if (email && email !== target.email) {
      const taken = await prisma.user.findFirst({
        where: { email, NOT: { id } },
      });
      if (taken) return jsonError("Email is already in use", 409);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        displayName: displayName === undefined ? undefined : displayName || null,
        email: email === undefined ? undefined : email || null,
        role: role ?? undefined,
        profileImageUrl:
          profileImageUrl === undefined ? undefined : profileImageUrl || null,
        balanceCents: balanceCents ?? undefined,
      },
    });

    await logEvent({
      category: "ADMIN",
      action: AuditAction.ADMIN_USER_UPDATE,
      status: "SUCCESS",
      message: `Admin "${admin.username}" updated user "${target.username}"`,
      userId: admin.id,
      username: admin.username,
      request,
      metadata: {
        targetUserId: target.id,
        targetUsername: target.username,
        changes: parsed.data,
      },
    });

    return jsonOk({ user: toAdminUser(updated) });
  } catch (err) {
    console.error("[admin/users PATCH]", err);
    const message = err instanceof Error ? err.message : "Failed to update user";
    return jsonError(message, 500);
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { user: admin, error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  if (id === admin.id) {
    return jsonError("You cannot delete your own account from the admin panel", 400);
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return jsonError("User not found", 404);

  await prisma.user.delete({ where: { id } });

  await logEvent({
    category: "ADMIN",
    action: AuditAction.ADMIN_USER_DELETE,
    status: "SUCCESS",
    message: `Admin "${admin.username}" deleted user "${target.username}"`,
    userId: admin.id,
    username: admin.username,
    request,
    metadata: { targetUserId: target.id, targetUsername: target.username },
  });

  return jsonOk({ success: true });
}
