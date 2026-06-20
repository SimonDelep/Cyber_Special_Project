"use server";

import { revalidatePath } from "next/cache";
import { auth, signOut } from "@/auth";
import { deleteLocalAvatar, isLocalAvatarUrl } from "@/lib/auth/avatar";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { logSystemEvent } from "@/lib/monitoring/logger";
import { prisma } from "@/lib/prisma";
import {
  changePasswordSchema,
  deleteAccountSchema,
  updateProfileSchema,
} from "@/lib/validations/auth";

export type ActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  user?: { name: string; image: string | null };
};

function fieldErrorsFromZod(error: { flatten: () => { fieldErrors: Record<string, string[]> } }) {
  return error.flatten().fieldErrors;
}

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const parsed = updateProfileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    profileImageUrl: formData.get("profileImageUrl"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const { name, email, profileImageUrl } = parsed.data;
  const normalizedEmail = email?.trim() || null;
  const imageUrl = profileImageUrl?.trim() || null;

  if (normalizedEmail) {
    const emailTaken = await prisma.user.findFirst({
      where: { email: normalizedEmail, NOT: { id: session.user.id } },
    });
    if (emailTaken) {
      return { error: "This email is already registered to another account." };
    }
  }

  const current = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { profileImageUrl: true },
  });

  if (
    current?.profileImageUrl &&
    isLocalAvatarUrl(current.profileImageUrl) &&
    current.profileImageUrl !== imageUrl
  ) {
    await deleteLocalAvatar(current.profileImageUrl);
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: name?.trim() || null,
      email: normalizedEmail,
      profileImageUrl: imageUrl,
    },
  });

  await logSystemEvent({
    type: "PROFILE_UPDATE",
    message: `Profile updated for user "${session.user.username}".`,
    userId: session.user.id,
    username: session.user.username,
    metadata: {
      fields: ["name", "email", "profileImageUrl"],
      emailChanged: normalizedEmail !== undefined,
    },
  });

  revalidatePath("/profile");
  return {
    success: true,
    user: {
      name: updated.name ?? updated.username,
      image: updated.profileImageUrl,
    },
  };
}

export async function changePasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmNewPassword: formData.get("confirmNewPassword"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return { error: "User not found." };
  }

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return { error: "Current password is incorrect." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });

  await logSystemEvent({
    type: "PASSWORD_CHANGE",
    message: `Password changed for user "${session.user.username}".`,
    userId: session.user.id,
    username: session.user.username,
  });

  return { success: true };
}

export async function deleteAccountAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const parsed = deleteAccountSchema.safeParse({
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return { error: "User not found." };
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return { error: "Password is incorrect. Account was not deleted." };
  }

  await deleteLocalAvatar(user.profileImageUrl);
  await prisma.user.delete({ where: { id: session.user.id } });

  await logSystemEvent({
    type: "ACCOUNT_DELETE",
    severity: "WARNING",
    message: `Account deleted for user "${user.username}".`,
    username: user.username,
    metadata: { userId: session.user.id },
  });

  await signOut({ redirectTo: "/" });
  return { success: true };
}

export async function logoutAction() {
  const session = await auth();
  if (session?.user) {
    await logSystemEvent({
      type: "LOGOUT",
      message: `User "${session.user.username}" signed out.`,
      userId: session.user.id,
      username: session.user.username,
    });
  }
  await signOut({ redirectTo: "/" });
}
