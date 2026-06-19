export function getClientIp(request?: Request): string | null {
  if (!request) return null;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim().slice(0, 64);

  return null;
}

export function getUserAgent(request?: Request): string | null {
  if (!request) return null;
  const ua = request.headers.get("user-agent");
  return ua ? ua.slice(0, 512) : null;
}
