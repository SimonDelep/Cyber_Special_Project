import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/admin/guard';
import { adminUpdateUser } from '@/lib/admin/users';
import { redirectResponse } from '@/lib/auth/response';
import { findUserById } from '@/lib/auth/users';
import { logEvent } from '@/lib/monitoring/logger';
import { EventType } from '@/lib/monitoring/events';
import type { UserRole } from '@/db/schema';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const admin = requireAdmin(context);
  if (admin instanceof Response) return admin;

  const form = await context.request.formData();
  const userId = Number(form.get('userId'));
  const displayName = String(form.get('displayName') ?? '').trim();
  const email = String(form.get('email') ?? '').trim();
  const bio = String(form.get('bio') ?? '').trim();
  const role = String(form.get('role') ?? 'user') as UserRole;

  if (!userId || !displayName || !email) {
    return redirectResponse('/admin?tab=users&error=Missing+required+fields');
  }

  if (role !== 'user' && role !== 'admin') {
    return redirectResponse('/admin?tab=users&error=Invalid+role');
  }

  if (userId === admin.id && role !== 'admin') {
    return redirectResponse('/admin?tab=users&error=Cannot+remove+your+own+admin+role');
  }

  try {
    await adminUpdateUser(userId, { displayName, email, bio, role });
    const target = await findUserById(userId);
    await logEvent({
      eventType: EventType.ADMIN_USER_UPDATE,
      severity: 'info',
      message: `Admin "${admin.username}" updated user "${target?.username}"`,
      userId: admin.id,
      username: admin.username,
      request: context.request,
      metadata: { targetUserId: userId, targetUsername: target?.username, role },
    });
    return redirectResponse('/admin?tab=users&success=User+updated');
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Update failed';
    return redirectResponse(`/admin?tab=users&error=${encodeURIComponent(msg)}`);
  }
};
