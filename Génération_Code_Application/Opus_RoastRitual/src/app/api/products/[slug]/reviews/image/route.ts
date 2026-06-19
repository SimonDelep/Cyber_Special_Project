import { NextResponse } from "next/server";

import { requireAuthApi } from "@/lib/auth/api-auth";
import { saveUploadedImage } from "@/lib/uploads/image";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authResult = await requireAuthApi();
  if ("error" in authResult) return authResult.error;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const result = await saveUploadedImage(file, {
      uploadSubdir: "reviews",
      filenamePrefix: authResult.user.id,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ imageUrl: result.url });
  } catch {
    return NextResponse.json(
      { error: "Unable to upload image" },
      { status: 500 },
    );
  }
}
