export type RequestContext = {
  ipAddress: string | null;
  userAgent: string | null;
  path: string | null;
  method: string | null;
};

export function getRequestContext(request?: Request): RequestContext {
  if (!request) {
    return { ipAddress: null, userAgent: null, path: null, method: null };
  }

  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress =
    forwarded?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    null;

  return {
    ipAddress,
    userAgent: request.headers.get('user-agent'),
    path: new URL(request.url).pathname,
    method: request.method,
  };
}
