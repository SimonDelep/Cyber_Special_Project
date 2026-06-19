import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { AVATAR_ALLOWED_TYPES, AVATAR_MAX_BYTES } from "./constants";

export function isAllowedAvatarType(type: string): boolean {
  return (AVATAR_ALLOWED_TYPES as readonly string[]).includes(type);
}

export function validateAvatarFile(file: File): string | null {
  if (!isAllowedAvatarType(file.type)) {
    return "Only JPEG, PNG, WebP, and GIF images are allowed";
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return "Image must be 2 MB or smaller";
  }
  return null;
}

export async function saveAvatarFile(userId: string, file: File): Promise<string> {
  const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "bin";
  const filename = `${userId}-${Date.now()}.${ext}`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "avatars");

  await mkdir(uploadsDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, filename), buffer);

  return `/uploads/avatars/${filename}`;
}

export function validateImageUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "Image URL must use http or https";
    }
    return null;
  } catch {
    return "Invalid image URL";
  }
}
