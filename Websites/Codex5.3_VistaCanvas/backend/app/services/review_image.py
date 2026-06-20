import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.config import settings

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


def ensure_review_upload_dir() -> Path:
    path = settings.upload_dir / "reviews"
    path.mkdir(parents=True, exist_ok=True)
    return path


async def save_review_image(review_id: int, file: UploadFile) -> str:
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be JPEG, PNG, WebP, or GIF",
        )

    content = await file.read()
    if len(content) > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds {settings.max_upload_size_mb} MB limit",
        )

    ext = EXTENSIONS[file.content_type]
    filename = f"{review_id}_{uuid.uuid4().hex}{ext}"
    upload_dir = ensure_review_upload_dir()
    file_path = upload_dir / filename
    file_path.write_bytes(content)

    return f"/uploads/reviews/{filename}"


def delete_local_review_image(image_url: str | None) -> None:
    if not image_url or not image_url.startswith("/uploads/reviews/"):
        return
    relative = image_url.removeprefix("/uploads/")
    path = settings.upload_dir / relative
    if path.exists():
        path.unlink()
