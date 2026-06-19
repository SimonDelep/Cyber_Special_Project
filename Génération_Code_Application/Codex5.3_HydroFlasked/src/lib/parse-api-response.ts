export async function parseApiResponse(
  res: Response,
): Promise<{ error?: string; [key: string]: unknown }> {
  try {
    const text = await res.text();
    if (!text) {
      return { error: res.ok ? undefined : "Unexpected server error" };
    }
    return JSON.parse(text) as { error?: string; [key: string]: unknown };
  } catch {
    return { error: "Unexpected server error" };
  }
}
