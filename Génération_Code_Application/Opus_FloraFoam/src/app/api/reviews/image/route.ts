import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveReviewImageFile } from "@/lib/reviews/image";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to upload a review image." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No image file provided." }, { status: 400 });
  }

  const { url, error } = await saveReviewImageFile(session.user.id, file);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  return NextResponse.json({ imageUrl: url });
}
