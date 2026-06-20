import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { randomBytes } from "node:crypto";

const MAX_BYTES = 2 * 1024 * 1024;
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

export type UploadFolder = "avatars" | "reviews";

export function isUploadedImage(
  path: string | null | undefined,
  folder: UploadFolder,
): boolean {
  return Boolean(path?.startsWith(`/uploads/${folder}/`));
}

export async function saveImageFile(
  file: File,
  folder: UploadFolder,
  prefix: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!ALLOWED_TYPES.has(file.type)) {
    return { ok: false, error: "Image must be JPEG, PNG, WebP, or GIF." };
  }

  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Image must be 2 MB or smaller." };
  }

  const uploadDir = resolve(process.cwd(), `public/uploads/${folder}`);
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }

  const ext = EXT_BY_TYPE[file.type] ?? (extname(file.name) || ".bin");
  const filename = `${prefix}-${randomBytes(8).toString("hex")}${ext}`;
  const diskPath = join(uploadDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  writeFileSync(diskPath, buffer);

  return { ok: true, url: `/uploads/${folder}/${filename}` };
}
