"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, signOut, unstable_update } from "@/auth";
import { countAdmins } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validations/user";
import type { ActionState } from "@/lib/action-state";
import { toActionError } from "@/lib/errors";

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "You must be signed in." };
  }

  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
  };

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const email = parsed.data.email.toLowerCase();

  const conflict = await prisma.user.findFirst({
    where: {
      email,
      NOT: { id: session.user.id },
    },
  });

  if (conflict) {
    return { error: "This email is already in use." };
  }

  let updated;
  try {
    updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: parsed.data.name,
        email,
      },
      select: {
        name: true,
        email: true,
        balanceCents: true,
      },
    });
  } catch (err) {
    return toActionError(err, {
      P2002: "This email is already in use.",
    });
  }

  await unstable_update({
    user: {
      name: updated.name,
      email: updated.email,
      balanceCents: updated.balanceCents,
    },
  });

  revalidatePath("/account");
  return { success: true };
}

export async function deleteAccountAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "You must be signed in." };
  }

  const confirm = formData.get("confirm");
  if (confirm !== "DELETE") {
    return { error: 'Type DELETE to confirm account removal.' };
  }

  if (session.user.role === "ADMIN") {
    const otherAdmins = await countAdmins(session.user.id);
    if (otherAdmins === 0) {
      return {
        error: "Cannot delete the last admin account. Promote another admin first.",
      };
    }
  }

  try {
    await prisma.user.delete({ where: { id: session.user.id } });
  } catch (err) {
    return toActionError(err);
  }

  await signOut({ redirectTo: "/" });
  redirect("/");
}
