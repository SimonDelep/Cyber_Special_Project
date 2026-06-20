import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { LogAction } from "@/lib/monitoring/actions";
import { logEvent } from "@/lib/monitoring/system-log";
import { hashPassword, verifyPassword } from "@/lib/password";
import { profileUpdateSchema } from "@/lib/validations/profile";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      bio: true,
      image: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const userId = session.user.id;

    const currentUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (data.username !== currentUser.username) {
      const taken = await db.user.findUnique({
        where: { username: data.username },
      });
      if (taken) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 409 },
        );
      }
    }

    const emailValue = data.email?.trim() ? data.email.trim() : null;
    if (emailValue && emailValue !== currentUser.email) {
      const emailTaken = await db.user.findUnique({
        where: { email: emailValue },
      });
      if (emailTaken) {
        return NextResponse.json(
          { error: "Email is already in use" },
          { status: 409 },
        );
      }
    }

    let passwordHash = currentUser.passwordHash;
    if (data.newPassword) {
      if (!data.currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to set a new password" },
          { status: 400 },
        );
      }

      const valid = await verifyPassword(
        data.currentPassword,
        currentUser.passwordHash,
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

      passwordHash = await hashPassword(data.newPassword);
    }

    const imageValue = data.image?.trim() ? data.image.trim() : null;

    const user = await db.user.update({
      where: { id: userId },
      data: {
        username: data.username,
        name: data.name?.trim() ? data.name.trim() : null,
        email: emailValue,
        bio: data.bio?.trim() ? data.bio.trim() : null,
        image: imageValue,
        passwordHash,
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        bio: true,
        image: true,
        role: true,
      },
    });

    const changedFields: string[] = [];
    if (data.username !== currentUser.username) changedFields.push("username");
    if ((data.name?.trim() || null) !== currentUser.name) changedFields.push("name");
    if (emailValue !== currentUser.email) changedFields.push("email");
    if ((data.bio?.trim() || null) !== currentUser.bio) changedFields.push("bio");
    if (imageValue !== currentUser.image) changedFields.push("image");
    if (data.newPassword) changedFields.push("password");

    await logEvent({
      category: "PROFILE",
      action: LogAction.PROFILE_UPDATE,
      message: `Profile updated for "${user.username}"`,
      userId: user.id,
      username: user.username,
      request,
      metadata: { changedFields },
      success: true,
    });

    return NextResponse.json({ message: "Profile updated", user });
  } catch {
    return NextResponse.json(
      { error: "Unable to update profile" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, username: true },
    });

    await db.user.delete({
      where: { id: session.user.id },
    });

    await logEvent({
      category: "PROFILE",
      action: LogAction.PROFILE_DELETE,
      message: `Account deleted: ${user?.username ?? session.user.id}`,
      userId: null,
      username: user?.username ?? session.user.username,
      request,
      success: true,
    });

    return NextResponse.json({ message: "Account deleted" });
  } catch {
    return NextResponse.json(
      { error: "Unable to delete account" },
      { status: 500 },
    );
  }
}
