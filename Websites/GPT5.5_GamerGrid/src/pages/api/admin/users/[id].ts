import type { APIRoute } from 'astro';
import { adminDeleteUser, adminUpdateUser } from '@/lib/admin/users';
import { requireAdminApi } from '@/lib/auth/guards';
import type { UserRole } from '@/db/schema';
import { errorResponse, jsonResponse, parseJsonBody } from '@/lib/http';
import { EventAction, logEvent } from '@/lib/monitoring';
import { findUserById } from '@/lib/auth/user';

export const PATCH: APIRoute = async (context) => {
  const admin = requireAdminApi(context);
  if (admin instanceof Response) return admin;

  const { id } = context.params;
  if (!id) return errorResponse('User id is required.', 400);

  const body = await parseJsonBody<{
    displayName?: string;
    email?: string;
    bio?: string;
    role?: UserRole;
    balance?: number;
    balanceDelta?: number;
  }>(context.request);
  if (body instanceof Response) return body;

  try {
    const targetBefore = await findUserById(id);
    const user = await adminUpdateUser(id, body, admin.id);
    await logEvent({
      category: 'admin',
      action: EventAction.ADMIN_USER_UPDATE,
      severity: 'info',
      status: 'success',
      message: `Admin ${admin.username} updated user ${user.username}.`,
      userId: user.id,
      username: user.username,
      metadata: {
        actorId: admin.id,
        actorUsername: admin.username,
        changes: body,
        previousBalance: targetBefore?.balance,
        newBalance: user.balance,
      },
      request: context.request,
    });
    return jsonResponse({ user });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update failed.';
    return errorResponse(message, 400);
  }
};

export const DELETE: APIRoute = async (context) => {
  const admin = requireAdminApi(context);
  if (admin instanceof Response) return admin;

  const { id } = context.params;
  if (!id) return errorResponse('User id is required.', 400);

  try {
    const target = await findUserById(id);
    await adminDeleteUser(id, admin.id);
    await logEvent({
      category: 'admin',
      action: EventAction.ADMIN_USER_DELETE,
      severity: 'warning',
      status: 'success',
      message: `Admin ${admin.username} deleted user ${target?.username ?? id}.`,
      userId: id,
      username: target?.username ?? null,
      metadata: { actorId: admin.id, actorUsername: admin.username },
      request: context.request,
    });
    return jsonResponse({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Delete failed.';
    return errorResponse(message, 400);
  }
};
