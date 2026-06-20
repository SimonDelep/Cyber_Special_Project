import { mkdir, writeFile } from "fs/promises";
import path from "path";

const MAX_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export async function saveAvatarFile(
  userId: string,
  file: File,
): Promise<{ url: string } | { error: string }> {
  if (!ALLOWED_TYPES.has(file.type)) {
    return { error: "Only JPEG, PNG, WebP, and GIF images are allowed" };
  }

  if (file.size > MAX_SIZE_BYTES) {
    return { error: "Image must be smaller than 2 MB" };
  }

  const ext = EXT_BY_TYPE[file.type] ?? ".jpg";
  const filename = `${userId}-${Date.now()}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");

  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  return { url: `/uploads/avatars/${filename}` };
}
