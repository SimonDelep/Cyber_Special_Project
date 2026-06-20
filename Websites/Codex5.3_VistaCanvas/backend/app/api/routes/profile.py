from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.security import hash_password, verify_password
from app.database import get_db
from app.models.system_event import EventStatus, EventType
from app.models.user import User
from app.schemas.user import (
    AvatarUrlRequest,
    DeleteAccountRequest,
    ProfileUpdateRequest,
    UserPublic,
)
from app.services.avatar import delete_local_avatar, save_avatar_file
from app.services.event_log import log_event

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/me", response_model=UserPublic)
def get_profile(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    return current_user


@router.put("/me", response_model=UserPublic)
def update_profile(
    payload: ProfileUpdateRequest,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    changes: list[str] = []
    if payload.email and payload.email != current_user.email:
        existing = db.query(User).filter(User.email == payload.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        current_user.email = payload.email
        changes.append("email")

    if payload.full_name is not None:
        current_user.full_name = payload.full_name or None
        changes.append("full_name")
    if payload.bio is not None:
        current_user.bio = payload.bio or None
        changes.append("bio")
    if payload.password:
        current_user.hashed_password = hash_password(payload.password)
        changes.append("password")

    db.commit()
    db.refresh(current_user)
    if changes:
        log_event(
            db,
            event_type=EventType.PROFILE_UPDATE,
            status=EventStatus.SUCCESS,
            message=f"Profile updated for {current_user.username}",
            user_id=current_user.id,
            username=current_user.username,
            metadata={"fields_changed": changes},
            request=request,
        )
    return current_user


@router.put("/me/avatar-url", response_model=UserPublic)
def set_avatar_url(
    payload: AvatarUrlRequest,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    url = payload.avatar_url.strip()
    if not (url.startswith("http://") or url.startswith("https://") or url.startswith("/uploads/")):
        raise HTTPException(status_code=400, detail="Invalid avatar URL")

    delete_local_avatar(current_user.avatar_url)
    current_user.avatar_url = url
    db.commit()
    db.refresh(current_user)
    log_event(
        db,
        event_type=EventType.PROFILE_AVATAR,
        status=EventStatus.SUCCESS,
        message=f"Avatar URL set for {current_user.username}",
        user_id=current_user.id,
        username=current_user.username,
        metadata={"method": "url"},
        request=request,
    )
    return current_user


@router.post("/me/avatar", response_model=UserPublic)
async def upload_avatar(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    file: UploadFile = File(...),
) -> User:
    delete_local_avatar(current_user.avatar_url)
    avatar_path = await save_avatar_file(current_user.id, file)
    current_user.avatar_url = avatar_path
    db.commit()
    db.refresh(current_user)
    log_event(
        db,
        event_type=EventType.PROFILE_AVATAR,
        status=EventStatus.SUCCESS,
        message=f"Avatar uploaded for {current_user.username}",
        user_id=current_user.id,
        username=current_user.username,
        metadata={"method": "file", "content_type": file.content_type},
        request=request,
    )
    return current_user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    payload: DeleteAccountRequest,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    if not verify_password(payload.password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect password")

    username = current_user.username
    user_id = current_user.id
    delete_local_avatar(current_user.avatar_url)
    db.delete(current_user)
    db.commit()
    log_event(
        db,
        event_type=EventType.ACCOUNT_DELETE,
        status=EventStatus.SUCCESS,
        message=f"Account deleted: {username}",
        user_id=user_id,
        username=username,
        request=request,
    )
