import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.config import settings

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024

EXT_MAP = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
}


async def save_upload(file: UploadFile, subfolder: str, prefix: str) -> str:
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be JPEG, PNG, GIF, or WebP",
        )

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be smaller than 5 MB",
        )

    ext = EXT_MAP.get(file.content_type, ".jpg")
    filename = f"{prefix}_{uuid.uuid4().hex}{ext}"

    target_dir = settings.upload_dir / subfolder
    target_dir.mkdir(parents=True, exist_ok=True)
    (target_dir / filename).write_bytes(content)

    return f"/uploads/{subfolder}/{filename}"


def delete_local_upload(url: str | None, subfolder: str) -> None:
    if not url or not url.startswith(f"/uploads/{subfolder}/"):
        return
    file_path = settings.upload_dir / subfolder / url.split(f"/uploads/{subfolder}/")[-1]
    if file_path.is_file():
        file_path.unlink(missing_ok=True)
