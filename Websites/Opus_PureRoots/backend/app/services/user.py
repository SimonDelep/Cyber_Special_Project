from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.services.auth import DuplicateUserError, get_user_by_email


ALLOWED_AVATAR_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
EXT_BY_TYPE = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


def update_profile(
    db: Session,
    user: User,
    *,
    email: str | None = None,
    full_name: str | None = None,
    bio: str | None = None,
    phone: str | None = None,
    password: str | None = None,
    clear_full_name: bool = False,
    clear_bio: bool = False,
    clear_phone: bool = False,
) -> User:
    if email is not None and email.lower() != user.email:
        existing = get_user_by_email(db, email)
        if existing and existing.id != user.id:
            raise DuplicateUserError("Email already in use")
        user.email = email.lower()

    if clear_full_name:
        user.full_name = None
    elif full_name is not None:
        user.full_name = full_name or None

    if clear_bio:
        user.bio = None
    elif bio is not None:
        user.bio = bio or None

    if clear_phone:
        user.phone = None
    elif phone is not None:
        user.phone = phone or None

    if password:
        user.password_hash = hash_password(password)

    db.commit()
    db.refresh(user)
    return user


def set_avatar_url(db: Session, user: User, url: str) -> User:
    user.avatar_url = url
    db.commit()
    db.refresh(user)
    return user


def save_avatar_file(db: Session, user: User, content: bytes, content_type: str) -> User:
    if content_type not in ALLOWED_AVATAR_TYPES:
        raise ValueError("Unsupported image type. Use JPEG, PNG, WebP, or GIF.")

    max_bytes = settings.max_avatar_size_mb * 1024 * 1024
    if len(content) > max_bytes:
        raise ValueError(f"Image must be under {settings.max_avatar_size_mb} MB.")

    settings.avatars_dir.mkdir(parents=True, exist_ok=True)
    ext = EXT_BY_TYPE[content_type]

    for old in settings.avatars_dir.glob(f"user_{user.id}.*"):
        old.unlink(missing_ok=True)

    path = settings.avatars_dir / f"user_{user.id}{ext}"
    path.write_bytes(content)

    user.avatar_url = f"/uploads/avatars/user_{user.id}{ext}"
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user: User) -> None:
    for path in settings.avatars_dir.glob(f"user_{user.id}.*"):
        path.unlink(missing_ok=True)
    db.delete(user)
    db.commit()


def list_all_users(db: Session) -> list[User]:
    return list(db.scalars(select(User).order_by(User.username)))


def admin_update_user_role(db: Session, user: User, role: UserRole) -> User:
    user.role = role
    db.commit()
    db.refresh(user)
    return user
