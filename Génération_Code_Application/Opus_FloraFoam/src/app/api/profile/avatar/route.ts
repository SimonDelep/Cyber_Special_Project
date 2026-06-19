import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteLocalAvatar, saveAvatarFile } from "@/lib/auth/avatar";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No image file provided." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { profileImageUrl: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const { url, error } = await saveAvatarFile(session.user.id, file);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  await deleteLocalAvatar(user.profileImageUrl);

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { profileImageUrl: url },
    select: { profileImageUrl: true },
  });

  return NextResponse.json({ profileImageUrl: updated.profileImageUrl });
}
