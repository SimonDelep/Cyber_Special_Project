import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const IMAGE_MAX_BYTES = 2 * 1024 * 1024;

const ALLOWED_TYPES = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
]);

export async function saveUploadedImage(
  uploadDir: string,
  publicPrefix: string,
  filenamePrefix: string,
  file: File,
): Promise<string> {
  if (file.size > IMAGE_MAX_BYTES) {
    throw new Error('Image must be 2 MB or smaller.');
  }

  const ext = ALLOWED_TYPES.get(file.type);
  if (!ext) {
    throw new Error('Allowed formats: JPEG, PNG, WebP, GIF.');
  }

  const dir = resolve(process.cwd(), uploadDir);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const filename = `${filenamePrefix}-${Date.now()}${ext}`;
  const diskPath = join(dir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  writeFileSync(diskPath, buffer);

  return `${publicPrefix}/${filename}`;
}

export function deleteLocalUpload(
  url: string | null | undefined,
  publicPrefix: string,
): void {
  if (!url?.startsWith(publicPrefix)) return;

  const diskPath = resolve(process.cwd(), 'public', url.slice(1));
  if (existsSync(diskPath)) {
    try {
      unlinkSync(diskPath);
    } catch {
      /* ignore */
    }
  }
}
