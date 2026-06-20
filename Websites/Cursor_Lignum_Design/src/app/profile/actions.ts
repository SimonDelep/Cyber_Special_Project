"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logEvent } from "@/lib/event-log";
import path from "path";
import { promises as fs } from "fs";
import crypto from "crypto";

async function saveUploadedAvatar(file: File) {
  if (!file || file.size === 0) return undefined;

  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error("IMAGE_TOO_LARGE");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const ext = (() => {
    const t = file.type.toLowerCase();
    if (t.includes("png")) return "png";
    if (t.includes("jpeg") || t.includes("jpg")) return "jpg";
    if (t.includes("webp")) return "webp";
    return "bin";
  })();

  const name = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${ext}`;
  const rel = `/uploads/avatars/${name}`;
  const abs = path.join(process.cwd(), "public", "uploads", "avatars", name);

  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, buffer);

  return rel;
}

const profileImageSchema = z.object({
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export async function updateProfilePictureAction(formData: FormData): Promise<void> {
  const { userId } = await requireUser();

  const raw = {
    imageUrl: String(formData.get("imageUrl") ?? ""),
  };

  const parsed = profileImageSchema.safeParse(raw);
  if (!parsed.success) {
    redirect("/profile?avatarError=1");
  }

  const file = formData.get("imageFile");
  const imageFile = file instanceof File ? file : undefined;

  let finalImageUrl = parsed.data.imageUrl?.trim() || undefined;
  if (!finalImageUrl && imageFile && imageFile.size > 0) {
    try {
      finalImageUrl = await saveUploadedAvatar(imageFile);
    } catch (e) {
      if (e instanceof Error && e.message === "IMAGE_TOO_LARGE") {
        redirect("/profile?avatarError=size");
      }
      redirect("/profile?avatarError=1");
    }
  }

  if (!finalImageUrl) {
    redirect("/profile?avatarError=empty");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { profileImageUrl: finalImageUrl },
  });

  await logEvent({
    type: "profile.avatar_updated",
    severity: "INFO",
    message: "Profile picture updated",
    userId,
    metadata: { source: parsed.data.imageUrl?.trim() ? "url" : "upload" },
  });

  revalidatePath("/profile");
  redirect("/profile?avatarUpdated=1");
}

export async function removeProfilePictureAction(): Promise<void> {
  const { userId } = await requireUser();

  await prisma.user.update({
    where: { id: userId },
    data: { profileImageUrl: null },
  });

  await logEvent({
    type: "profile.avatar_removed",
    severity: "INFO",
    message: "Profile picture removed",
    userId,
  });

  revalidatePath("/profile");
  redirect("/profile?avatarRemoved=1");
}

const updateSchema = z.object({
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_.-]+$/),
  email: z.string().email(),
  firstName: z.string().max(80).optional().or(z.literal("")),
  lastName: z.string().max(80).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  newPassword: z.string().min(8).max(128).optional().or(z.literal("")),
});

export async function updateProfileAction(formData: FormData): Promise<void> {
  const { userId } = await requireUser();

  const raw = {
    username: String(formData.get("username") ?? ""),
    email: String(formData.get("email") ?? ""),
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
  };

  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) {
    await logEvent({
      type: "profile.update_failed",
      severity: "WARN",
      message: "Profile update failed: validation error",
      userId,
    });
    redirect("/profile?error=1");
  }

  const emailLower = parsed.data.email.toLowerCase();

  const clash = await prisma.user.findFirst({
    where: {
      id: { not: userId },
      OR: [{ email: emailLower }, { username: parsed.data.username }],
    },
    select: { id: true },
  });
  if (clash) redirect("/profile?error=exists");

  const passwordHash =
    parsed.data.newPassword && parsed.data.newPassword.length > 0
      ? await bcrypt.hash(parsed.data.newPassword, 12)
      : undefined;

  await prisma.user.update({
    where: { id: userId },
    data: {
      username: parsed.data.username,
      email: emailLower,
      firstName: parsed.data.firstName || null,
      lastName: parsed.data.lastName || null,
      phone: parsed.data.phone || null,
      ...(passwordHash ? { passwordHash } : {}),
    },
  });

  revalidatePath("/profile");
  await logEvent({
    type: "profile.updated",
    severity: "INFO",
    message: "Profile updated",
    userId,
    metadata: { changedPassword: !!passwordHash },
  });
  redirect("/profile?updated=1");
}

export async function deleteAccountAction() {
  const { userId } = await requireUser();

  await prisma.session.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
  await logEvent({
    type: "profile.deleted",
    severity: "WARN",
    message: "Account deleted",
    userId,
  });

  // Redirecting to /logout clears the session cookie (handled in the route).
  redirect("/logout");
}

