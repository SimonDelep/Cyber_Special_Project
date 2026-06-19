export type RequestContext = {
  ipAddress: string | null;
  userAgent: string | null;
};

export function getRequestContext(request: Request): RequestContext {
  const forwarded = request.headers.get("x-forwarded-for");
  const ipAddress = forwarded
    ? forwarded.split(",")[0]?.trim() ?? null
    : request.headers.get("x-real-ip");

  return {
    ipAddress: ipAddress ?? null,
    userAgent: request.headers.get("user-agent"),
  };
}
