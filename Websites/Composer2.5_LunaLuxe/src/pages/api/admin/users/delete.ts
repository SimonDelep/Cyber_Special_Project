import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/admin/guard';
import { adminDeleteUser } from '@/lib/admin/users';
import { deleteLocalAvatar } from '@/lib/auth/avatar';
import { findUserById } from '@/lib/auth/users';
import { redirectResponse } from '@/lib/auth/response';
import { logEvent } from '@/lib/monitoring/logger';
import { EventType } from '@/lib/monitoring/events';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const admin = requireAdmin(context);
  if (admin instanceof Response) return admin;

  const form = await context.request.formData();
  const userId = Number(form.get('userId'));
  const confirm = String(form.get('confirmUsername') ?? '').trim();

  if (!userId) {
    return redirectResponse('/admin?tab=users&error=Invalid+user');
  }

  const target = await findUserById(userId);
  if (!target) {
    return redirectResponse('/admin?tab=users&error=User+not+found');
  }

  if (confirm !== target.username) {
    return redirectResponse('/admin?tab=users&error=Username+confirmation+does+not+match');
  }

  try {
    if (target.avatarUrl) deleteLocalAvatar(target.avatarUrl);
    await adminDeleteUser(userId, admin.id);
    await logEvent({
      eventType: EventType.ADMIN_USER_DELETE,
      severity: 'warning',
      message: `Admin "${admin.username}" deleted user "${target.username}"`,
      userId: admin.id,
      username: admin.username,
      request: context.request,
      metadata: { targetUserId: userId, targetUsername: target.username },
    });
    return redirectResponse('/admin?tab=users&success=User+deleted');
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Delete failed';
    return redirectResponse(`/admin?tab=users&error=${encodeURIComponent(msg)}`);
  }
};
