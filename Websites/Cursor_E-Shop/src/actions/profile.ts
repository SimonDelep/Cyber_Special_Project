"use server";

import { revalidatePath } from "next/cache";
import { auth, unstable_update } from "@/auth";
import type { ActionState } from "@/lib/action-state";
import {
  AuditAction,
  logAuditEventWithRequest,
} from "@/lib/audit";
import { saveUserAvatarFile } from "@/lib/avatar-storage";
import { toActionError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import {
  AVATAR_ALLOWED_MIME,
  AVATAR_MAX_BYTES,
  AVATAR_MIME_TO_EXT,
  avatarUrlSchema,
} from "@/lib/validations/profile";

async function requireSessionUser() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }
  return session.user;
}

async function persistAvatar(
  userId: string,
  userEmail: string,
  avatarUrl: string,
  source: "url" | "file"
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl },
  });

  await unstable_update({
    user: { avatarUrl },
  });

  await logAuditEventWithRequest({
    action: AuditAction.PROFILE_AVATAR_UPDATE,
    userId,
    userEmail,
    resourceType: "user",
    resourceId: userId,
    details: { source },
  });

  revalidatePath("/account");
  revalidatePath("/", "layout");
}

export async function updateAvatarFromUrlAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireSessionUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const parsed = avatarUrlSchema.safeParse({
    avatarUrl: formData.get("avatarUrl"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await persistAvatar(
      user.id,
      user.email,
      parsed.data.avatarUrl,
      "url"
    );
    return { success: true, message: "Profile picture updated." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function updateAvatarFromFileAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireSessionUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const file = formData.get("avatarFile");
  if (!(file instanceof File) || file.size === 0) {
    return { fieldErrors: { avatarFile: ["Please choose an image file."] } };
  }

  if (file.size > AVATAR_MAX_BYTES) {
    return {
      fieldErrors: {
        avatarFile: ["Image must be 2 MB or smaller."],
      },
    };
  }

  const mime = file.type;
  if (!AVATAR_ALLOWED_MIME.has(mime)) {
    return {
      fieldErrors: {
        avatarFile: ["Only JPEG, PNG, WebP, or GIF images are allowed."],
      },
    };
  }

  const ext = AVATAR_MIME_TO_EXT[mime];
  if (!ext) {
    return {
      fieldErrors: {
        avatarFile: ["Unsupported image type."],
      },
    };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const publicPath = await saveUserAvatarFile(user.id, buffer, ext);
    await persistAvatar(user.id, user.email, publicPath, "file");
    return { success: true, message: "Profile picture uploaded." };
  } catch (err) {
    return toActionError(err);
  }
}
