import type { APIRoute } from "astro";
import { requireAdminApi, parseIdParam } from "@/lib/admin/guard";
import { toAdminUserView } from "@/lib/admin/users";
import {
  normalizeEmail,
  validateDisplayName,
  validateEmail,
  validateBio,
} from "@/lib/auth/validation";
import { userRoles, type UserRole } from "@/db/schema";
import {
  deleteUser,
  emailTakenByOther,
  findUserById,
  listAllUsers,
  updateUser,
} from "@/db/users";
import { revokeAllUserSessions } from "@/lib/auth/session";
import { errorResponse, jsonResponse } from "@/lib/api/response";
import { logEventFromRequest } from "@/lib/monitoring/logger";

export const GET: APIRoute = ({ locals, params }) => {
  const admin = requireAdminApi(locals);
  if (admin instanceof Response) return admin;

  const id = parseIdParam(params.id);
  if (!id) return errorResponse("Invalid user id.", 400);

  const user = findUserById(id);
  if (!user) return errorResponse("User not found.", 404);

  return jsonResponse({ user: toAdminUserView(user) });
};

export const PUT: APIRoute = async ({ locals, params, request }) => {
  const admin = requireAdminApi(locals);
  if (admin instanceof Response) return admin;

  const id = parseIdParam(params.id);
  if (!id) return errorResponse("Invalid user id.", 400);

  const existing = findUserById(id);
  if (!existing) return errorResponse("User not found.", 404);

  try {
    const body = await request.json();
    const updates: Parameters<typeof updateUser>[1] = {};
    const errors: string[] = [];

    if (body.displayName !== undefined) {
      const err = validateDisplayName(String(body.displayName));
      if (err) errors.push(err);
      else updates.displayName = String(body.displayName).trim();
    }

    if (body.email !== undefined) {
      const email = normalizeEmail(String(body.email));
      const err = validateEmail(email);
      if (err) errors.push(err);
      else if (emailTakenByOther(email, id)) {
        errors.push("Email is already in use.");
      } else {
        updates.email = email;
      }
    }

    if (body.bio !== undefined) {
      const err = validateBio(String(body.bio));
      if (err) errors.push(err);
      else updates.bio = String(body.bio);
    }

    if (body.role !== undefined) {
      const role = String(body.role) as UserRole;
      if (!userRoles.includes(role)) {
        errors.push("Role must be user or admin.");
      } else if (existing.role === "admin" && role === "user") {
        const admins = listAllUsers().filter((u) => u.role === "admin");
        if (admins.length <= 1) {
          errors.push("Cannot demote the last administrator.");
        } else {
          updates.role = role;
        }
      } else {
        updates.role = role;
      }
    }

    if (body.balanceCents !== undefined) {
      const balance = Number(body.balanceCents);
      if (!Number.isInteger(balance) || balance < 0) {
        errors.push("Balance must be a non-negative integer (cents).");
      } else {
        updates.balanceCents = balance;
      }
    }

    if (body.balanceAdjustmentCents !== undefined) {
      const adj = Number(body.balanceAdjustmentCents);
      if (!Number.isInteger(adj)) {
        errors.push("Balance adjustment must be an integer (cents).");
      } else {
        const next = existing.balanceCents + adj;
        if (next < 0) {
          errors.push("Balance cannot be negative.");
        } else {
          updates.balanceCents = next;
        }
      }
    }

    if (errors.length > 0) {
      return errorResponse(errors.join(" "), 400);
    }

    if (Object.keys(updates).length === 0) {
      return jsonResponse({ user: toAdminUserView(existing) });
    }

    const updated = updateUser(id, updates);
    if (!updated) return errorResponse("User not found.", 404);

    logEventFromRequest(request, {
      eventType: "admin.user.update",
      status: "success",
      userId: admin.id,
      actorLabel: admin.username,
      message: `Admin ${admin.username} updated user ${existing.username} (id ${id}).`,
      metadata: {
        targetUserId: id,
        targetUsername: existing.username,
        fields: Object.keys(updates),
        previousBalanceCents: existing.balanceCents,
        newBalanceCents: updated.balanceCents,
      },
    });

    return jsonResponse({ user: toAdminUserView(updated) });
  } catch {
    return errorResponse("Failed to update user.", 500);
  }
};

export const DELETE: APIRoute = ({ locals, params, request }) => {
  const admin = requireAdminApi(locals);
  if (admin instanceof Response) return admin;

  const id = parseIdParam(params.id);
  if (!id) return errorResponse("Invalid user id.", 400);

  if (id === admin.id) {
    return errorResponse("You cannot delete your own account from the admin panel.", 400);
  }

  const existing = findUserById(id);
  if (!existing) return errorResponse("User not found.", 404);

  if (existing.role === "admin") {
    const admins = listAllUsers().filter((u) => u.role === "admin");
    if (admins.length <= 1) {
      return errorResponse("Cannot delete the last administrator.", 400);
    }
  }

  revokeAllUserSessions(id);
  deleteUser(id);

  logEventFromRequest(request, {
    eventType: "admin.user.delete",
    status: "success",
    userId: admin.id,
    actorLabel: admin.username,
    message: `Admin ${admin.username} deleted user ${existing.username} (id ${id}).`,
    metadata: { targetUserId: id, targetUsername: existing.username },
  });

  return jsonResponse({ ok: true });
};
