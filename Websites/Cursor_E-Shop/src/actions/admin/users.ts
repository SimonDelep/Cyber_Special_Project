"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, countAdmins } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminUserSchema } from "@/lib/validations/user";
import type { ActionState } from "@/lib/action-state";
import { AuditAction, logAuditEventWithRequest } from "@/lib/audit";
import { toActionError } from "@/lib/errors";

export async function updateUserAction(
  userId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const adminSession = await requireAdmin();

  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    balanceCents: formData.get("balanceCents"),
  };

  const parsed = adminUserSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    return { error: "User not found." };
  }

  const email = parsed.data.email.toLowerCase();

  const conflict = await prisma.user.findFirst({
    where: { email, NOT: { id: userId } },
  });
  if (conflict) {
    return { error: "This email is already in use." };
  }

  if (target.role === "ADMIN" && parsed.data.role === "CUSTOMER") {
    const otherAdmins = await countAdmins(userId);
    if (otherAdmins === 0) {
      return { error: "Cannot demote the last admin account." };
    }
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: parsed.data.name,
        email,
        role: parsed.data.role,
        balanceCents: parsed.data.balanceCents,
      },
    });
  } catch (err) {
    return toActionError(err, {
      P2002: "This email is already in use.",
    });
  }

  await logAuditEventWithRequest({
    action: AuditAction.ADMIN_USER_UPDATE,
    userId: adminSession.user.id,
    userEmail: adminSession.user.email,
    resourceType: "user",
    resourceId: userId,
    details: {
      targetEmail: email,
      role: parsed.data.role,
      balanceCents: parsed.data.balanceCents,
    },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { success: true };
}
