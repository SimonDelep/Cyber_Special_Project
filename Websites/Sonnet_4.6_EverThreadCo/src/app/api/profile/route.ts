import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { EventActions } from "@/lib/events/actions";
import { logEvent } from "@/lib/events/logger";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { authOptions } from "@/lib/auth-options";
import { normalizeAvatarUrl } from "@/lib/auth/upload";
import { prisma } from "@/lib/prisma";
import {
  deleteAccountSchema,
  profileUpdateSchema,
} from "@/lib/validations/auth";

async function getAuthenticatedUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const wantsPasswordChange =
      data.newPassword && data.newPassword.length > 0;

    if (wantsPasswordChange) {
      if (!data.currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to set a new password" },
          { status: 400 },
        );
      }
      const valid = await verifyPassword(
        data.currentPassword,
        user.passwordHash,
      );
      if (!valid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 },
        );
      }
      if (data.newPassword !== data.confirmNewPassword) {
        return NextResponse.json(
          { error: "New passwords do not match" },
          { status: 400 },
        );
      }
    }

    const emailTaken = await prisma.user.findFirst({
      where: {
        email: data.email.toLowerCase(),
        NOT: { id: userId },
      },
    });
    if (emailTaken) {
      return NextResponse.json(
        { error: "Email is already in use" },
        { status: 409 },
      );
    }

    const avatarUrl = normalizeAvatarUrl(data.avatarUrl ?? null);
    if (data.avatarUrl && data.avatarUrl.trim() !== "" && !avatarUrl) {
      return NextResponse.json(
        { error: "Avatar must be a valid http(s) URL or a site upload path" },
        { status: 400 },
      );
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        email: data.email.toLowerCase(),
        displayName: data.displayName?.trim() || null,
        bio: data.bio?.trim() || null,
        avatarUrl,
        ...(wantsPasswordChange
          ? { passwordHash: await hashPassword(data.newPassword!) }
          : {}),
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
      },
    });

    await logEvent({
      category: "PROFILE",
      action: EventActions.PROFILE_UPDATE,
      message: `Profile updated for @${updated.username}`,
      userId: updated.id,
      username: updated.username,
      request,
      metadata: {
        emailChanged: user.email !== updated.email,
        passwordChanged: wantsPasswordChange,
      },
    });

    return NextResponse.json({ message: "Profile updated", user: updated });
  } catch {
    return NextResponse.json(
      { error: "Unable to update profile" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = deleteAccountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Password is incorrect" },
        { status: 400 },
      );
    }

    await prisma.user.delete({ where: { id: userId } });

    await logEvent({
      category: "PROFILE",
      action: EventActions.PROFILE_DELETE,
      severity: "WARN",
      message: `Account deleted: @${user.username}`,
      username: user.username,
      request,
      metadata: { userId },
    });

    return NextResponse.json({ message: "Account deleted" });
  } catch {
    return NextResponse.json(
      { error: "Unable to delete account" },
      { status: 500 },
    );
  }
}
