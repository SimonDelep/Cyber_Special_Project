import type { APIRoute } from "astro";
import { AuditEvent, logSystemEvent } from "@/lib/audit";
import {
  adminAdjustUserBalance,
  adminDeleteUser,
  adminSetUserBalance,
  adminUpdateUser,
  adminUpdateUserRole,
  resolveAuthUser,
} from "@/lib/auth";
import { parseDollarsToCents, parseSignedDollarsToCents } from "@/lib/admin/guard";
import {
  pathWithMessage,
  readFormString,
} from "@/lib/http";
import type { UserRole } from "@/db/schema";

export const POST: APIRoute = async ({ request, locals, cookies, params, redirect }) => {
  const actor = resolveAuthUser(locals, cookies);
  if (!actor || actor.role !== "admin") {
    return redirect(pathWithMessage("/admin/users", "error", "Admin access required."));
  }

  const targetId = Number(params.id);
  if (!Number.isFinite(targetId)) {
    return redirect(pathWithMessage("/admin/users", "error", "Invalid user ID."));
  }

  const returnPath = `/admin/users/${targetId}`;
  const formData = await request.formData();
  const action = await readFormString(formData, "action");

  if (action === "delete") {
    const result = adminDeleteUser(actor, targetId);
    if (!result.ok) {
      return redirect(pathWithMessage("/admin/users", "error", result.error ?? "Delete failed."));
    }
    logSystemEvent({
      eventType: AuditEvent.ADMIN_USER_DELETE,
      category: "admin",
      outcome: "success",
      message: `Admin @${actor.username} deleted user #${targetId}.`,
      actorUserId: actor.id,
      actorUsername: actor.username,
      targetUserId: targetId,
      targetResource: `user:${targetId}`,
      request,
    });
    return redirect(pathWithMessage("/admin/users", "success", "User deleted."));
  }

  if (action === "role") {
    const role = (await readFormString(formData, "role")) as UserRole;
    if (role !== "user" && role !== "admin") {
      return redirect(pathWithMessage(returnPath, "error", "Invalid role."));
    }
    const result = adminUpdateUserRole(actor, targetId, role);
    if (!result.ok) {
      return redirect(pathWithMessage(returnPath, "error", result.error ?? "Role update failed."));
    }
    logSystemEvent({
      eventType: AuditEvent.ADMIN_USER_ROLE,
      category: "admin",
      outcome: "success",
      message: `Admin @${actor.username} set user #${targetId} role to ${role}.`,
      actorUserId: actor.id,
      actorUsername: actor.username,
      targetUserId: targetId,
      targetResource: `user:${targetId}`,
      metadata: { role },
      request,
    });
    return redirect(pathWithMessage(returnPath, "success", "Role updated."));
  }

  if (action === "update") {
    const displayName = await readFormString(formData, "displayName");
    const email = await readFormString(formData, "email");
    const password = await readFormString(formData, "password");
    const roleRaw = await readFormString(formData, "role");

    const input: Parameters<typeof adminUpdateUser>[2] = {
      displayName,
      email,
    };
    if (password.trim()) input.password = password;
    if (roleRaw === "user" || roleRaw === "admin") input.role = roleRaw;

    const result = adminUpdateUser(actor, targetId, input);
    if (result.error) {
      return redirect(pathWithMessage(returnPath, "error", result.error));
    }
    logSystemEvent({
      eventType: AuditEvent.ADMIN_USER_UPDATE,
      category: "admin",
      outcome: "success",
      message: `Admin @${actor.username} updated user #${targetId}.`,
      actorUserId: actor.id,
      actorUsername: actor.username,
      targetUserId: targetId,
      targetResource: `user:${targetId}`,
      metadata: { role: input.role, passwordChanged: Boolean(password.trim()) },
      request,
    });
    return redirect(pathWithMessage(returnPath, "success", "Profile updated."));
  }

  if (action === "balance-adjust") {
    const amount = await readFormString(formData, "adjustAmount");
    const parsed = parseSignedDollarsToCents(amount);
    if (parsed.error) {
      return redirect(pathWithMessage(returnPath, "error", parsed.error));
    }
    const result = adminAdjustUserBalance(actor, targetId, parsed.cents!);
    if (result.error) {
      return redirect(pathWithMessage(returnPath, "error", result.error));
    }
    logSystemEvent({
      eventType: AuditEvent.ADMIN_USER_BALANCE,
      category: "admin",
      outcome: "success",
      message: `Admin @${actor.username} adjusted balance for user #${targetId}.`,
      actorUserId: actor.id,
      actorUsername: actor.username,
      targetUserId: targetId,
      targetResource: `user:${targetId}`,
      metadata: { adjustCents: parsed.cents },
      request,
    });
    return redirect(pathWithMessage(returnPath, "success", "Balance adjusted."));
  }

  if (action === "balance-set") {
    const amount = await readFormString(formData, "setBalance");
    const parsed = parseDollarsToCents(amount);
    if (parsed.error) {
      return redirect(pathWithMessage(returnPath, "error", parsed.error));
    }
    const result = adminSetUserBalance(actor, targetId, parsed.cents ?? 0);
    if (result.error) {
      return redirect(pathWithMessage(returnPath, "error", result.error));
    }
    logSystemEvent({
      eventType: AuditEvent.ADMIN_USER_BALANCE,
      category: "admin",
      outcome: "success",
      message: `Admin @${actor.username} set balance for user #${targetId}.`,
      actorUserId: actor.id,
      actorUsername: actor.username,
      targetUserId: targetId,
      targetResource: `user:${targetId}`,
      metadata: { setBalanceCents: parsed.cents ?? 0 },
      request,
    });
    return redirect(pathWithMessage(returnPath, "success", "Balance set."));
  }

  return redirect(pathWithMessage(returnPath, "error", "Unknown action."));
};
