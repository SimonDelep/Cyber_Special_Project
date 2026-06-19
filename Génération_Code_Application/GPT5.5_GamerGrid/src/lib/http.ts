export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

export async function parseJsonBody<T extends Record<string, unknown>>(
  request: Request,
): Promise<T | Response> {
  try {
    return (await request.json()) as T;
  } catch {
    return errorResponse('Invalid JSON body.', 400);
  }
}
