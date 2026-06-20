import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.config import settings

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
}


def get_uploads_path() -> Path:
    path = settings.uploads_path
    path.mkdir(parents=True, exist_ok=True)
    return path


def validate_image_url(url: str) -> str:
    url = url.strip()
    if not url.startswith(("http://", "https://", "/uploads/")):
        raise HTTPException(
            status_code=400,
            detail="URL must start with http://, https://, or /uploads/",
        )
    return url


async def save_image_file(file: UploadFile, subfolder: str, prefix: str) -> str:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image type. Use JPEG, PNG, GIF, or WebP.",
        )

    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file extension.",
        )

    content = await file.read()
    max_bytes = settings.max_avatar_size_mb * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Max {settings.max_avatar_size_mb} MB.",
        )

    dest_dir = get_uploads_path() / subfolder
    dest_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{prefix}_{uuid.uuid4().hex}{suffix}"
    dest = dest_dir / filename
    dest.write_bytes(content)

    return f"/uploads/{subfolder}/{filename}"
