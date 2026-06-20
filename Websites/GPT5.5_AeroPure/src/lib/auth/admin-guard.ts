import { getCurrentUser } from "@/lib/auth/session";
import { requireAdmin } from "@/lib/auth/rbac";
import { jsonError } from "@/lib/auth/api";
import type { SessionUser } from "@/lib/auth/session";

export async function requireAdminApi(): Promise<
  { user: SessionUser } | { response: Response }
> {
  const currentUser = await getCurrentUser();
  try {
    return { user: requireAdmin(currentUser) };
  } catch {
    return { response: jsonError("Admin access required", 403) };
  }
}
