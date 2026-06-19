import type { APIRoute } from "astro";
import { jsonResponse } from "@/lib/api/response";

export const GET: APIRoute = ({ locals }) => {
  return jsonResponse({ user: locals.user });
};
