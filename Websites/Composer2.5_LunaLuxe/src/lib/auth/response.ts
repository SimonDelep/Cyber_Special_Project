export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function redirectResponse(location: string, cookies?: string[]): Response {
  const headers = new Headers({ Location: location });
  for (const cookie of cookies ?? []) {
    headers.append('Set-Cookie', cookie);
  }
  return new Response(null, { status: 302, headers });
}

export function isSecureRequest(request: Request): boolean {
  const forwarded = request.headers.get('x-forwarded-proto');
  if (forwarded) return forwarded === 'https';
  return new URL(request.url).protocol === 'https:';
}
