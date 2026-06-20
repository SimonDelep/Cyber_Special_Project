import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
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
): Promise<{ publicPath: string } | { error: string }> {
  if (!ALLOWED_TYPES.has(file.type)) {
    return { error: "File must be JPEG, PNG, WebP, or GIF" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: "File must be 2 MB or smaller" };
  }

  const ext = EXT_BY_TYPE[file.type] ?? ".bin";
  const filename = `${userId}-${Date.now()}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  return { publicPath: `/uploads/avatars/${filename}` };
}

export function normalizeAvatarUrl(value: string | null | undefined): string | null {
  return normalizeImageUrl(value, "/uploads/avatars/");
}

export async function saveReviewImageFile(
  userId: string,
  file: File,
): Promise<{ publicPath: string } | { error: string }> {
  if (!ALLOWED_TYPES.has(file.type)) {
    return { error: "File must be JPEG, PNG, WebP, or GIF" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: "File must be 2 MB or smaller" };
  }

  const ext = EXT_BY_TYPE[file.type] ?? ".bin";
  const filename = `${userId}-${Date.now()}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "reviews");
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  return { publicPath: `/uploads/reviews/${filename}` };
}

export function normalizeReviewImageUrl(
  value: string | null | undefined,
): string | null {
  return normalizeImageUrl(value, "/uploads/reviews/");
}

function normalizeImageUrl(
  value: string | null | undefined,
  uploadPrefix: string,
): string | null {
  if (!value || value.trim() === "") {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.startsWith(uploadPrefix)) {
    return trimmed;
  }
  try {
    const url = new URL(trimmed);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return trimmed;
    }
  } catch {
    return null;
  }
  return null;
}
