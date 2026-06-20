import { mkdir, readdir, unlink, writeFile } from "fs/promises";
import path from "path";

const AVATAR_DIR = path.join(process.cwd(), "public", "uploads", "avatars");

export function avatarPublicPath(userId: string, ext: string): string {
  return `/uploads/avatars/${userId}.${ext}`;
}

export async function removeUserAvatarFiles(userId: string): Promise<void> {
  try {
    const files = await readdir(AVATAR_DIR);
    const prefix = `${userId}.`;
    await Promise.all(
      files
        .filter((name) => name.startsWith(prefix))
        .map((name) => unlink(path.join(AVATAR_DIR, name)))
    );
  } catch {
    // Directory may not exist yet.
  }
}

export async function saveUserAvatarFile(
  userId: string,
  data: Buffer,
  ext: string
): Promise<string> {
  await mkdir(AVATAR_DIR, { recursive: true });
  await removeUserAvatarFiles(userId);
  const filename = `${userId}.${ext}`;
  await writeFile(path.join(AVATAR_DIR, filename), data);
  return avatarPublicPath(userId, ext);
}
