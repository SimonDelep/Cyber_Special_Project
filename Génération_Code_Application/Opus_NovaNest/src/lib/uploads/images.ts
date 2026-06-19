import { mkdirSync, existsSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

export function saveUploadedImage(
  uploadSubdir: 'avatars' | 'reviews',
  buffer: Buffer,
  mimeType: string,
): { publicPath: string } {
  if (!ALLOWED_TYPES.has(mimeType)) {
    throw new Error('Unsupported image type. Use JPEG, PNG, WebP, or GIF.');
  }
  if (buffer.length > MAX_BYTES) {
    throw new Error('Image must be 2 MB or smaller.');
  }

  const uploadDir = resolve(process.cwd(), `public/uploads/${uploadSubdir}`);
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }

  const ext = EXT_BY_MIME[mimeType] ?? '.bin';
  const filename = `${randomBytes(16).toString('hex')}${ext}`;
  const diskPath = join(uploadDir, filename);
  writeFileSync(diskPath, buffer);
  return { publicPath: `/uploads/${uploadSubdir}/${filename}` };
}

export function deleteUploadedImage(
  uploadSubdir: 'avatars' | 'reviews',
  publicPath: string | null,
): void {
  const prefix = `/uploads/${uploadSubdir}/`;
  if (!publicPath?.startsWith(prefix)) return;
  const diskPath = resolve(process.cwd(), 'public', publicPath.slice(1));
  if (existsSync(diskPath)) {
    try {
      unlinkSync(diskPath);
    } catch {
      /* ignore */
    }
  }
}
