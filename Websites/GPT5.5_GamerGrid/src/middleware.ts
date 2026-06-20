import { defineMiddleware } from 'astro:middleware';
import { getUserFromSession, purgeExpiredSessions } from '@/lib/auth/session';

let lastPurge = 0;

export const onRequest = defineMiddleware(async (context, next) => {
  const now = Date.now();
  if (now - lastPurge > 60_000) {
    lastPurge = now;
    await purgeExpiredSessions().catch(() => undefined);
  }

  context.locals.user = await getUserFromSession(context.cookies);
  return next();
});
