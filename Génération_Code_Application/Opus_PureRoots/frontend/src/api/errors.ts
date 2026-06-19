/** Parse FastAPI `detail` from a JSON error body. */
export function parseApiDetail(data: unknown): string | null {
  if (!data || typeof data !== "object" || !("detail" in data)) return null;
  const detail = (data as { detail: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const parts = detail
      .map((item) => {
        if (typeof item === "object" && item && "msg" in item) {
          return String((item as { msg?: string }).msg ?? "").replace(/^Value error,\s*/i, "");
        }
        return "";
      })
      .filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  }
  return null;
}

const GENERIC_NOT_FOUND = new Set(["not found", "not found."]);

/**
 * Build a user-facing error message from an API response.
 * Keeps server messages like "User not found"; only substitutes when the route itself is missing.
 */
export function apiErrorMessage(
  status: number,
  data: unknown,
  fallback = "Request failed",
  options?: { missingRouteHint?: string }
): string {
  const detail = parseApiDetail(data);
  if (detail) {
    if (status === 404 && GENERIC_NOT_FOUND.has(detail.trim().toLowerCase())) {
      return options?.missingRouteHint ?? "The requested API endpoint does not exist on the server.";
    }
    return detail;
  }
  if (status === 404 && options?.missingRouteHint) return options.missingRouteHint;
  if (status === 401) return "Please sign in again.";
  if (status === 403) return "You do not have permission for this action.";
  if (status === 503 || status === 502) {
    return "The API server is not responding. Start the backend on port 8000.";
  }
  return fallback;
}
