import type { APIRoute } from "astro";
import {
  deleteUploadedAvatar,
  isUploadedAvatar,
  saveAvatarFile,
} from "@/lib/auth/avatar";
import { toPublicUser } from "@/lib/auth/session";
import { findUserById, updateUser } from "@/db/users";
import { errorResponse, jsonResponse } from "@/lib/api/response";

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return errorResponse("Authentication required.", 401);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("avatar");

    if (!(file instanceof File) || file.size === 0) {
      return errorResponse("Please select an image file to upload.", 400);
    }

    const dbUser = findUserById(locals.user.id);
    if (!dbUser) {
      return errorResponse("User not found.", 404);
    }

    const saved = await saveAvatarFile(file, locals.user.id);
    if (!saved.ok) {
      return errorResponse(saved.error, 400);
    }

    if (isUploadedAvatar(dbUser.avatarUrl)) {
      deleteUploadedAvatar(dbUser.avatarUrl);
    }

    const updated = updateUser(locals.user.id, { avatarUrl: saved.url });
    if (!updated) {
      return errorResponse("User not found.", 404);
    }

    return jsonResponse({ user: toPublicUser(updated), avatarUrl: saved.url });
  } catch {
    return errorResponse("Avatar upload failed.", 500);
  }
};
