import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.config import settings
from app.core.deps import get_current_user
from app.core.event_logger import CATEGORY_PROFILE, log_event
from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    ProfilePictureUrlUpdate,
    UserProfileUpdate,
    UserRead,
)

router = APIRouter(prefix="/users", tags=["users"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024


def _delete_local_avatar(url: str | None) -> None:
    if not url or not url.startswith("/uploads/avatars/"):
        return
    file_path = settings.upload_dir / url.removeprefix("/uploads/avatars/")
    if file_path.is_file():
        file_path.unlink(missing_ok=True)


@router.get("/me", response_model=UserRead)
def get_profile(current_user: User = Depends(get_current_user)):
    return UserRead.model_validate(current_user)


@router.put("/me", response_model=UserRead)
def update_profile(
    payload: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.username and payload.username != current_user.username:
        existing = db.query(User).filter(User.username == payload.username).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken",
            )
        current_user.username = payload.username

    if payload.email is not None and payload.email != current_user.email:
        if payload.email:
            existing = db.query(User).filter(User.email == payload.email).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered",
                )
        current_user.email = payload.email

    if payload.full_name is not None:
        current_user.full_name = payload.full_name

    if payload.profile_picture_url is not None:
        _delete_local_avatar(current_user.profile_picture_url)
        current_user.profile_picture_url = payload.profile_picture_url or None

    db.commit()
    db.refresh(current_user)
    log_event(
        db,
        category=CATEGORY_PROFILE,
        action="profile_update",
        user=current_user,
        success=True,
        message=f"User '{current_user.username}' updated profile",
        details={"fields": payload.model_dump(exclude_unset=True)},
    )
    return UserRead.model_validate(current_user)


@router.put("/me/profile-picture-url", response_model=UserRead)
def set_profile_picture_url(
    payload: ProfilePictureUrlUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _delete_local_avatar(current_user.profile_picture_url)
    current_user.profile_picture_url = payload.profile_picture_url.strip()
    db.commit()
    db.refresh(current_user)
    log_event(
        db,
        category=CATEGORY_PROFILE,
        action="profile_picture_url",
        user=current_user,
        success=True,
        message=f"User '{current_user.username}' set profile picture URL",
    )
    return UserRead.model_validate(current_user)


@router.post("/me/profile-picture", response_model=UserRead)
async def upload_profile_picture(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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

    ext_map = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/gif": ".gif",
        "image/webp": ".webp",
    }
    ext = ext_map.get(file.content_type, ".jpg")
    filename = f"{current_user.id}_{uuid.uuid4().hex}{ext}"

    avatar_dir = settings.upload_dir / "avatars"
    avatar_dir.mkdir(parents=True, exist_ok=True)
    file_path = avatar_dir / filename
    file_path.write_bytes(content)

    _delete_local_avatar(current_user.profile_picture_url)
    current_user.profile_picture_url = f"/uploads/avatars/{filename}"
    db.commit()
    db.refresh(current_user)
    log_event(
        db,
        category=CATEGORY_PROFILE,
        action="profile_picture_upload",
        user=current_user,
        success=True,
        message=f"User '{current_user.username}' uploaded profile picture",
    )
    return UserRead.model_validate(current_user)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    username = current_user.username
    user_id = current_user.id
    _delete_local_avatar(current_user.profile_picture_url)
    db.delete(current_user)
    db.commit()
    log_event(
        db,
        category=CATEGORY_PROFILE,
        action="account_delete",
        username=username,
        success=True,
        message=f"User '{username}' deleted their account",
        details={"user_id": user_id},
    )
    return None
