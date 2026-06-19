import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

ALLOWED_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024


def ensure_upload_dir() -> Path:
    path = settings.upload_dir_path
    path.mkdir(parents=True, exist_ok=True)
    return path


async def save_image_file(file: UploadFile, subdirectory: str) -> str:
    content_type = file.content_type or ""
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image must be JPEG, PNG, WebP, or GIF",
        )

    data = await file.read()
    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file")
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image must be 5 MB or smaller",
        )

    upload_root = ensure_upload_dir()
    target_dir = upload_root / subdirectory
    target_dir.mkdir(parents=True, exist_ok=True)

    extension = ALLOWED_CONTENT_TYPES[content_type]
    filename = f"{uuid.uuid4().hex}{extension}"
    destination = target_dir / filename
    destination.write_bytes(data)

    return f"/api/uploads/{subdirectory}/{filename}"


async def save_review_image(file: UploadFile) -> str:
    return await save_image_file(file, "reviews")


async def save_avatar_image(file: UploadFile) -> str:
    return await save_image_file(file, "avatars")
