import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/admin/guard';
import { adjustUserBalance, setUserBalance } from '@/lib/admin/users';
import { redirectResponse } from '@/lib/auth/response';
import { findUserById } from '@/lib/auth/users';
import { logEvent } from '@/lib/monitoring/logger';
import { EventType } from '@/lib/monitoring/events';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const admin = requireAdmin(context);
  if (admin instanceof Response) return admin;

  const form = await context.request.formData();
  const userId = Number(form.get('userId'));
  const mode = String(form.get('mode') ?? 'set');

  if (!userId) {
    return redirectResponse('/admin?tab=users&error=Invalid+user');
  }

  try {
    if (mode === 'adjust') {
      const delta = Number(form.get('balanceDelta'));
      if (!Number.isFinite(delta)) {
        return redirectResponse('/admin?tab=users&error=Invalid+adjustment+amount');
      }
      await adjustUserBalance(userId, delta);
      const target = await findUserById(userId);
      await logEvent({
        eventType: EventType.ADMIN_USER_BALANCE,
        severity: 'info',
        message: `Admin "${admin.username}" adjusted balance for "${target?.username}" by ${delta}`,
        userId: admin.id,
        username: admin.username,
        request: context.request,
        metadata: { targetUserId: userId, targetUsername: target?.username, mode: 'adjust', delta },
      });
      return redirectResponse('/admin?tab=users&success=Balance+adjusted');
    }

    const balance = Number(form.get('balance'));
    await setUserBalance(userId, balance);
    const target = await findUserById(userId);
    await logEvent({
      eventType: EventType.ADMIN_USER_BALANCE,
      severity: 'info',
      message: `Admin "${admin.username}" set balance for "${target?.username}" to ${balance}`,
      userId: admin.id,
      username: admin.username,
      request: context.request,
      metadata: { targetUserId: userId, targetUsername: target?.username, mode: 'set', balance },
    });
    return redirectResponse('/admin?tab=users&success=Balance+updated');
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Balance update failed';
    return redirectResponse(`/admin?tab=users&error=${encodeURIComponent(msg)}`);
  }
};
