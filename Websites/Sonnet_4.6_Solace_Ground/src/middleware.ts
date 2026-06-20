import { defineMiddleware } from 'astro:middleware';
import {
  getSessionIdFromCookies,
  getUserBySessionId,
} from '@/lib/auth/session';

export const onRequest = defineMiddleware(async (context, next) => {
  const sessionId = getSessionIdFromCookies(context.cookies);
  context.locals.user = sessionId ? getUserBySessionId(sessionId) : null;
  return next();
});
