import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { AVATAR_ALLOWED_TYPES, AVATAR_MAX_BYTES } from '@/lib/auth/constants';

const UPLOAD_DIR = resolve(process.cwd(), 'public', 'uploads', 'avatars');

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

export async function saveAvatarFile(
  userId: string,
  file: File,
): Promise<string> {
  if (!AVATAR_ALLOWED_TYPES.has(file.type)) {
    throw new Error('Avatar must be JPEG, PNG, WebP, or GIF.');
  }
  if (file.size > AVATAR_MAX_BYTES) {
    throw new Error('Avatar must be 2 MB or smaller.');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = EXT_BY_TYPE[file.type] ?? (extname(file.name) || '.jpg');
  const filename = `${userId}-${Date.now()}${ext}`;
  const diskPath = resolve(UPLOAD_DIR, filename);

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(diskPath, buffer);

  return `/uploads/avatars/${filename}`;
}

export async function deleteAvatarFile(profilePicture: string | null): Promise<void> {
  if (!profilePicture?.startsWith('/uploads/avatars/')) return;

  const diskPath = resolve(process.cwd(), 'public', profilePicture.replace(/^\//, ''));
  try {
    await unlink(diskPath);
  } catch {
    // File may already be removed
  }
}
