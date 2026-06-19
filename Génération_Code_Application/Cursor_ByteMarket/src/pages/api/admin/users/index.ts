import type { APIRoute } from "astro";
import { AuditEvent, logSystemEvent } from "@/lib/audit";
import { adminCreateUser, resolveAuthUser } from "@/lib/auth";
import { parseDollarsToCents } from "@/lib/admin/guard";
import { pathWithMessage, readFormString } from "@/lib/http";
import type { UserRole } from "@/db/schema";

export const POST: APIRoute = async ({ request, locals, cookies, redirect }) => {
  const actor = resolveAuthUser(locals, cookies);
  if (!actor || actor.role !== "admin") {
    return redirect(pathWithMessage("/admin/users", "error", "Admin access required."));
  }

  const formData = await request.formData();
  const username = await readFormString(formData, "username");
  const password = await readFormString(formData, "password");
  const displayName = await readFormString(formData, "displayName");
  const email = await readFormString(formData, "email");
  const role = (await readFormString(formData, "role")) as UserRole;
  const balanceInput = await readFormString(formData, "balance");

  let balanceCents = 0;
  if (balanceInput.trim()) {
    const parsed = parseDollarsToCents(balanceInput);
    if (parsed.error) {
      return redirect(pathWithMessage("/admin/users/new", "error", parsed.error));
    }
    balanceCents = parsed.cents ?? 0;
  }

  const result = adminCreateUser(actor, {
    username,
    password,
    displayName: displayName || undefined,
    email: email || undefined,
    role: role === "admin" ? "admin" : "user",
    balanceCents,
  });

  if (result.error) {
    return redirect(pathWithMessage("/admin/users/new", "error", result.error));
  }

  logSystemEvent({
    eventType: AuditEvent.ADMIN_USER_CREATE,
    category: "admin",
    outcome: "success",
    message: `Admin @${actor.username} created user @${result.user!.username}.`,
    actorUserId: actor.id,
    actorUsername: actor.username,
    targetUserId: result.user!.id,
    targetResource: `user:${result.user!.id}`,
    metadata: { role: result.user!.role, balanceCents },
    request,
  });

  return redirect(
    pathWithMessage(`/admin/users/${result.user!.id}`, "success", "User created."),
  );
};
