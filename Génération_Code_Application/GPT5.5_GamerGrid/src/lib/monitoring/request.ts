export type RequestMeta = {
  ipAddress: string | null;
  userAgent: string | null;
};

export function getRequestMeta(request?: Request): RequestMeta {
  if (!request) {
    return { ipAddress: null, userAgent: null };
  }

  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress =
    (forwarded ? forwarded.split(',')[0]?.trim() : null) ??
    request.headers.get('x-real-ip') ??
    request.headers.get('cf-connecting-ip') ??
    null;

  const userAgent = request.headers.get('user-agent');

  return {
    ipAddress,
    userAgent: userAgent ? userAgent.slice(0, 512) : null,
  };
}
