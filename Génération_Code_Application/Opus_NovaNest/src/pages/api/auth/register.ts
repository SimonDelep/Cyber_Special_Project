import type { APIRoute } from 'astro';
import { hashPassword } from '../../../lib/auth/password';
import {
  validateUsername,
  validateEmail,
  validatePassword,
  validateDisplayName,
  validateAvatarUrl,
} from '../../../lib/auth/validation';
import { findUserByUsername, findUserByEmail, createUser } from '../../../lib/db/users';
import { loginUser } from '../../../lib/auth/session';
import { errorResponse, jsonResponse, parseJsonBody } from '../../../lib/api/response';
import { logEvent } from '../../../lib/events/logger';
import {
  EVENT_ACTION,
  EVENT_CATEGORY,
  EVENT_OUTCOME,
} from '../../../lib/events/constants';

export const POST: APIRoute = async ({ request, cookies }) => {
  const body = await parseJsonBody<{
    username?: string;
    password?: string;
    email?: string;
    displayName?: string;
    avatarUrl?: string;
  }>(request);

  if (!body) return errorResponse('Invalid JSON body.');

  const username = body.username ?? '';
  const password = body.password ?? '';
  const email = body.email ?? '';
  const displayName = body.displayName ?? username;
  const avatarUrl = body.avatarUrl?.trim() || null;

  const errors = [
    validateUsername(username),
    validateEmail(email),
    validatePassword(password),
    validateDisplayName(displayName),
    avatarUrl ? validateAvatarUrl(avatarUrl) : null,
  ].filter(Boolean);

  if (errors.length > 0) return errorResponse(errors[0]!);

  if (findUserByUsername(username)) {
    return errorResponse('Username is already taken.', 409);
  }
  if (findUserByEmail(email)) {
    return errorResponse('Email is already registered.', 409);
  }

  const passwordHash = await hashPassword(password);
  const user = createUser({
    username,
    passwordHash,
    email,
    displayName,
    avatarUrl,
  });

  loginUser(cookies, user.id);

  logEvent({
    category: EVENT_CATEGORY.AUTH,
    action: EVENT_ACTION.REGISTER,
    outcome: EVENT_OUTCOME.SUCCESS,
    message: `New account registered: "${user.username}".`,
    userId: user.id,
    username: user.username,
    request,
    metadata: { email: user.email },
  });

  return jsonResponse({ user }, 201);
};
