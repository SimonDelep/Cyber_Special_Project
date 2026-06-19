import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  isAllowedAvatarType,
  validateAvatarFile,
  validateImageUrl,
} from "@/lib/auth/avatar";

export { validateImageUrl };

export function validateReviewImageFile(file: File): string | null {
  return validateAvatarFile(file);
}

export async function saveReviewImageFile(userId: string, file: File): Promise<string> {
  if (!isAllowedAvatarType(file.type)) {
    throw new Error("Invalid image type");
  }

  const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "bin";
  const filename = `${userId}-${Date.now()}.${ext}`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "reviews");

  await mkdir(uploadsDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, filename), buffer);

  return `/uploads/reviews/${filename}`;
}
