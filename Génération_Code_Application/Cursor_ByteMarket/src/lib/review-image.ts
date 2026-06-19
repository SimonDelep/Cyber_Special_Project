import { createHash } from "node:crypto";
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const REVIEW_IMAGE_MAX_BYTES = 3 * 1024 * 1024;
export const REVIEW_IMAGE_UPLOAD_PREFIX = "/uploads/reviews/";

const ALLOWED_MIME_TYPES = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);

function reviewImageDir(): string {
  return join(process.cwd(), "public", "uploads", "reviews");
}

export function isLocalReviewImageUrl(
  url: string | null | undefined,
): url is string {
  return !!url && url.startsWith(REVIEW_IMAGE_UPLOAD_PREFIX);
}

export function deleteLocalReviewImage(url: string | null | undefined): void {
  if (!isLocalReviewImageUrl(url)) return;
  const filePath = join(process.cwd(), "public", url);
  if (existsSync(filePath)) {
    unlinkSync(filePath);
  }
}

export function validateReviewImageUrl(url: string): string | null {
  const value = url.trim();
  if (!value) return null;

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "Image URL must start with http:// or https://.";
    }
    return null;
  } catch {
    return "Enter a valid image URL.";
  }
}

export async function saveReviewImageFile(
  userId: number,
  file: File,
): Promise<{ url?: string; error?: string }> {
  if (!file.size) {
    return { error: "Choose an image file to upload." };
  }

  if (file.size > REVIEW_IMAGE_MAX_BYTES) {
    return { error: "Image must be 3 MB or smaller." };
  }

  const extension = ALLOWED_MIME_TYPES.get(file.type);
  if (!extension) {
    return { error: "Supported formats: JPEG, PNG, WebP, and GIF." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 12);
  const filename = `review-${userId}-${Date.now()}-${hash}${extension}`;

  mkdirSync(reviewImageDir(), { recursive: true });
  writeFileSync(join(reviewImageDir(), filename), buffer);

  return { url: `${REVIEW_IMAGE_UPLOAD_PREFIX}${filename}` };
}
