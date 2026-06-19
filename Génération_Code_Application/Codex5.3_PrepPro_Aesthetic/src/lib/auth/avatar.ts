import { unlinkSync, existsSync, resolve } from "node:fs";
import { isUploadedImage, saveImageFile } from "@/lib/uploads/images";

export function isUploadedAvatar(path: string | null | undefined): boolean {
  return isUploadedImage(path, "avatars");
}

export function deleteUploadedAvatar(path: string | null | undefined): void {
  if (!isUploadedAvatar(path)) return;
  const filePath = resolve(process.cwd(), "public", path!.slice(1));
  if (existsSync(filePath)) {
    try {
      unlinkSync(filePath);
    } catch {
      /* ignore */
    }
  }
}

export async function saveAvatarFile(
  file: File,
  userId: number,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  return saveImageFile(file, "avatars", String(userId));
}
