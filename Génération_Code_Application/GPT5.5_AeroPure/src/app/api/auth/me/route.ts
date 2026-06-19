import { getCurrentUser } from "@/lib/auth/session";
import { jsonError, jsonSuccess } from "@/lib/auth/api";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Not authenticated", 401);
  }

  return jsonSuccess({ user });
}
