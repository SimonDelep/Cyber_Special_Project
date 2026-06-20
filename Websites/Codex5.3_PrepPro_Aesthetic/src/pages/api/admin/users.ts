import type { APIRoute } from "astro";
import { requireAdminApi } from "@/lib/admin/guard";
import { toAdminUserView } from "@/lib/admin/users";
import { listAllUsers } from "@/db/users";
import { jsonResponse } from "@/lib/api/response";

export const GET: APIRoute = ({ locals }) => {
  const admin = requireAdminApi(locals);
  if (admin instanceof Response) return admin;

  const users = listAllUsers().map(toAdminUserView);
  return jsonResponse({ users, count: users.length });
};
