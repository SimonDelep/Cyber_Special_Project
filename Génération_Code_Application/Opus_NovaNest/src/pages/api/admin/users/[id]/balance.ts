import type { APIRoute } from 'astro';
import { getAdminFromCookies } from '../../../../../lib/api/admin-guard';
import { validateBalanceCents } from '../../../../../lib/auth/product-validation';
import {
  adjustUserBalance,
  findUserById,
  setUserBalance,
} from '../../../../../lib/db/users';
import { errorResponse, jsonResponse, parseJsonBody } from '../../../../../lib/api/response';
import { logEvent } from '../../../../../lib/events/logger';
import {
  EVENT_ACTION,
  EVENT_CATEGORY,
  EVENT_OUTCOME,
} from '../../../../../lib/events/constants';

function parseUserId(params: { id?: string }): number | null {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) return null;
  return id;
}

export const PATCH: APIRoute = async ({ params, request, cookies }) => {
  const admin = getAdminFromCookies(cookies);
  if (admin instanceof Response) return admin;

  const userId = parseUserId(params);
  if (!userId) return errorResponse('Invalid user id.');

  if (!findUserById(userId)) {
    return errorResponse('User not found.', 404);
  }

  const body = await parseJsonBody<{
    balanceCents?: number;
    adjustCents?: number;
  }>(request);

  if (!body) return errorResponse('Invalid JSON body.');

  const hasSet = body.balanceCents !== undefined;
  const hasAdjust = body.adjustCents !== undefined;

  if (hasSet === hasAdjust) {
    return errorResponse('Provide either balanceCents (set) or adjustCents (add/subtract).');
  }

  const target = findUserById(userId)!;

  if (hasSet) {
    const err = validateBalanceCents(body.balanceCents);
    if (err) return errorResponse(err);
    const updated = setUserBalance(userId, body.balanceCents!);
    if (!updated) return errorResponse('Failed to update balance.', 500);
    logEvent({
      category: EVENT_CATEGORY.ADMIN,
      action: EVENT_ACTION.ADMIN_BALANCE,
      outcome: EVENT_OUTCOME.SUCCESS,
      message: `Admin "${admin.username}" set balance for "${target.username}" to ${body.balanceCents} cents.`,
      userId: admin.id,
      username: admin.username,
      request,
      metadata: {
        targetUserId: userId,
        balanceCents: body.balanceCents,
        mode: 'set',
      },
    });
    return jsonResponse({ user: updated });
  }

  if (typeof body.adjustCents !== 'number' || !Number.isInteger(body.adjustCents)) {
    return errorResponse('adjustCents must be a whole number.');
  }

  const updated = adjustUserBalance(userId, body.adjustCents);
  if (!updated) {
    return errorResponse('Balance cannot go below zero.', 400);
  }

  logEvent({
    category: EVENT_CATEGORY.ADMIN,
    action: EVENT_ACTION.ADMIN_BALANCE,
    outcome: EVENT_OUTCOME.SUCCESS,
    message: `Admin "${admin.username}" adjusted balance for "${target.username}" by ${body.adjustCents} cents.`,
    userId: admin.id,
    username: admin.username,
    request,
    metadata: {
      targetUserId: userId,
      adjustCents: body.adjustCents,
      newBalanceCents: updated.balanceCents,
      mode: 'adjust',
    },
  });

  return jsonResponse({ user: updated });
};
