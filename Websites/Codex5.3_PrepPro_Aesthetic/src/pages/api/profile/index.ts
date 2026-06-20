import type { APIRoute } from "astro";
import { hashPassword, validatePassword, verifyPassword } from "@/lib/auth/password";
import {
  validateBio,
  validateDisplayName,
  validateEmail,
  validateAvatarUrl,
  normalizeEmail,
} from "@/lib/auth/validation";
import {
  deleteUploadedAvatar,
  isUploadedAvatar,
} from "@/lib/auth/avatar";
import {
  destroySessionCookie,
  getSessionTokenFromCookies,
  revokeAllUserSessions,
  revokeSession,
  toPublicUser,
} from "@/lib/auth/session";
import {
  deleteUser,
  findUserById,
  findUserByEmail,
  updateUser,
} from "@/db/users";
import { errorResponse, jsonResponse } from "@/lib/api/response";
import { logEventFromRequest } from "@/lib/monitoring/logger";

export const GET: APIRoute = ({ locals }) => {
  if (!locals.user) {
    return errorResponse("Authentication required.", 401);
  }
  return jsonResponse({ user: locals.user });
};

export const PUT: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return errorResponse("Authentication required.", 401);
  }

  try {
    const body = await request.json();
    const dbUser = findUserById(locals.user.id);
    if (!dbUser) {
      return errorResponse("User not found.", 404);
    }

    const updates: Parameters<typeof updateUser>[1] = {};
    const errors: string[] = [];

    if (body.displayName !== undefined) {
      const nameErr = validateDisplayName(String(body.displayName));
      if (nameErr) errors.push(nameErr);
      else updates.displayName = String(body.displayName).trim();
    }

    if (body.email !== undefined) {
      const email = normalizeEmail(String(body.email));
      const emailErr = validateEmail(email);
      if (emailErr) errors.push(emailErr);
      else {
        const existing = findUserByEmail(email);
        if (existing && existing.id !== locals.user.id) {
          errors.push("Email is already in use.");
        } else {
          updates.email = email;
        }
      }
    }

    if (body.bio !== undefined) {
      const bio = String(body.bio);
      const bioErr = validateBio(bio);
      if (bioErr) errors.push(bioErr);
      else updates.bio = bio;
    }

    if (body.avatarUrl !== undefined) {
      const url = String(body.avatarUrl).trim();
      if (url === "") {
        if (isUploadedAvatar(dbUser.avatarUrl)) {
          deleteUploadedAvatar(dbUser.avatarUrl);
        }
        updates.avatarUrl = null;
      } else {
        const urlErr = validateAvatarUrl(url);
        if (urlErr) errors.push(urlErr);
        else {
          if (isUploadedAvatar(dbUser.avatarUrl)) {
            deleteUploadedAvatar(dbUser.avatarUrl);
          }
          updates.avatarUrl = url;
        }
      }
    }

    if (body.currentPassword !== undefined || body.newPassword !== undefined) {
      const current = String(body.currentPassword ?? "");
      const next = String(body.newPassword ?? "");
      const passErr = validatePassword(next);
      if (!current) errors.push("Current password is required to change password.");
      if (passErr) errors.push(passErr);
      if (errors.length === 0) {
        const valid = await verifyPassword(current, dbUser.passwordHash);
        if (!valid) errors.push("Current password is incorrect.");
        else updates.passwordHash = await hashPassword(next);
      }
    }

    if (errors.length > 0) {
      return errorResponse(errors.join(" "), 400);
    }

    if (Object.keys(updates).length === 0) {
      return jsonResponse({ user: locals.user });
    }

    const updated = updateUser(locals.user.id, updates);
    if (!updated) {
      return errorResponse("User not found.", 404);
    }

    const changedFields = Object.keys(updates).filter(
      (k) => k !== "passwordHash",
    );
    if (updates.passwordHash) changedFields.push("password");

    logEventFromRequest(request, {
      eventType: "profile.update",
      status: "success",
      userId: locals.user.id,
      actorLabel: locals.user.username,
      message: `Profile updated for ${locals.user.username}.`,
      metadata: { fields: changedFields },
    });

    return jsonResponse({ user: toPublicUser(updated) });
  } catch {
    return errorResponse("Failed to update profile.", 500);
  }
};

export const DELETE: APIRoute = async ({ request, locals, cookies }) => {
  if (!locals.user) {
    return errorResponse("Authentication required.", 401);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const password = String(body.password ?? "");
    const confirm = String(body.confirmUsername ?? "");

    if (confirm !== locals.user.username) {
      return errorResponse("Username confirmation does not match.", 400);
    }

    const dbUser = findUserById(locals.user.id);
    if (!dbUser) {
      return errorResponse("User not found.", 404);
    }

    const valid = await verifyPassword(password, dbUser.passwordHash);
    if (!valid) {
      return errorResponse("Password is incorrect.", 401);
    }

    if (isUploadedAvatar(dbUser.avatarUrl)) {
      deleteUploadedAvatar(dbUser.avatarUrl);
    }

    const token = getSessionTokenFromCookies(cookies);
    revokeSession(token);
    revokeAllUserSessions(locals.user.id);
    deleteUser(locals.user.id);
    destroySessionCookie(cookies);

    logEventFromRequest(request, {
      eventType: "profile.delete",
      status: "success",
      userId: locals.user.id,
      actorLabel: locals.user.username,
      message: `Account deleted: ${locals.user.username}.`,
    });

    return jsonResponse({ ok: true });
  } catch {
    return errorResponse("Failed to delete account.", 500);
  }
};
