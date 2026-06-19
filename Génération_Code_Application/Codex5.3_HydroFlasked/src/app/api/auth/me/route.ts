import { getSessionUser } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return jsonError("Not authenticated", 401);
  }
  return jsonOk({ user });
}
