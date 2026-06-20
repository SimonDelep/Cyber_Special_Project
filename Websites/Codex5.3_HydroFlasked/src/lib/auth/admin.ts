import { jsonError } from "@/lib/api";
import { getSessionUser, isAdmin, type SafeUser } from "@/lib/auth/session";

type AdminCheck =
  | { user: SafeUser; error: null }
  | { user: null; error: ReturnType<typeof jsonError> };

export async function requireAdmin(): Promise<AdminCheck> {
  const user = await getSessionUser();
  if (!user) {
    return { user: null, error: jsonError("Not authenticated", 401) };
  }
  if (!isAdmin(user)) {
    return { user: null, error: jsonError("Admin access required", 403) };
  }
  return { user, error: null };
}
