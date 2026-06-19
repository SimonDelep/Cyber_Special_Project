import { writeFile, mkdir } from "fs/promises";
import path from "path";
import {
  ALLOWED_AVATAR_TYPES,
  MAX_AVATAR_SIZE_BYTES,
} from "@/lib/auth/constants";

type ImageFolder = "avatars" | "reviews";

export async function saveImageFile(
  folder: ImageFolder,
  prefix: string,
  file: File,
): Promise<string> {
  if (
    !ALLOWED_AVATAR_TYPES.includes(
      file.type as (typeof ALLOWED_AVATAR_TYPES)[number],
    )
  ) {
    throw new Error("Invalid file type. Use JPEG, PNG, WebP, or GIF.");
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    throw new Error("File too large. Maximum size is 2 MB.");
  }

  const ext =
    file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const filename = `${prefix}-${Date.now()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", folder);

  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  return `/uploads/${folder}/${filename}`;
}

export function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
