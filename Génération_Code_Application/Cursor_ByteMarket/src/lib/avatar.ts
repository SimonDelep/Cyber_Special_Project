import { createHash } from "node:crypto";
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_UPLOAD_PREFIX = "/uploads/avatars/";

const ALLOWED_MIME_TYPES = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);

function avatarDir(): string {
  return join(process.cwd(), "public", "uploads", "avatars");
}

export function isLocalAvatarUrl(url: string | null | undefined): url is string {
  return !!url && url.startsWith(AVATAR_UPLOAD_PREFIX);
}

export function deleteLocalAvatar(url: string | null | undefined): void {
  if (!isLocalAvatarUrl(url)) return;
  const filePath = join(process.cwd(), "public", url);
  if (existsSync(filePath)) {
    unlinkSync(filePath);
  }
}

export function validateAvatarUrl(url: string): string | null {
  const value = url.trim();
  if (!value) return "Enter an image URL or upload a file.";

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "Avatar URL must start with http:// or https://.";
    }
    return null;
  } catch {
    return "Enter a valid image URL.";
  }
}

export async function saveAvatarFile(
  userId: number,
  file: File,
): Promise<{ url?: string; error?: string }> {
  if (!file.size) {
    return { error: "Choose an image file to upload." };
  }

  if (file.size > AVATAR_MAX_BYTES) {
    return { error: "Image must be 2 MB or smaller." };
  }

  const extension = ALLOWED_MIME_TYPES.get(file.type);
  if (!extension) {
    return { error: "Supported formats: JPEG, PNG, WebP, and GIF." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 12);
  const filename = `user-${userId}-${hash}${extension}`;

  mkdirSync(avatarDir(), { recursive: true });
  writeFileSync(join(avatarDir(), filename), buffer);

  return { url: `${AVATAR_UPLOAD_PREFIX}${filename}` };
}

export function getAvatarInitials(
  username: string,
  displayName?: string | null,
): string {
  const source = (displayName?.trim() || username).replace(/[^a-zA-Z0-9]/g, "");
  return (source.slice(0, 2) || username.slice(0, 2)).toUpperCase();
}
