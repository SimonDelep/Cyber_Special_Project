from fastapi import APIRouter, File, HTTPException, Request, Response, UploadFile, status

from app.api.deps import CurrentUser, DbSession, SessionToken
from app.core.config import settings
from app.core.security import hash_password, verify_password
from app.models.system_event import EventCategory, EventSeverity
from app.schemas.user import (
    AccountDeleteRequest,
    AvatarUploadResponse,
    UserPasswordChange,
    UserProfileUpdate,
    UserPublic,
)
from app.services.auth import get_user_by_email, revoke_all_user_sessions, revoke_session
from app.services.events import log_event
from app.services.uploads import save_avatar_image

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserPublic)
def get_profile(user: CurrentUser) -> UserPublic:
    return UserPublic.model_validate(user)


@router.patch("/me", response_model=UserPublic)
def update_profile(
    payload: UserProfileUpdate,
    request: Request,
    user: CurrentUser,
    db: DbSession,
) -> UserPublic:
    changes: list[str] = []
    updates = payload.model_dump(exclude_unset=True)

    if "email" in updates:
        email = updates["email"].lower()
        existing = get_user_by_email(db, email)
        if existing and existing.id != user.id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already in use")
        if user.email != email:
            changes.append("email")
        user.email = email
    if "first_name" in updates:
        value = updates["first_name"] or None
        if user.first_name != value:
            changes.append("first_name")
        user.first_name = value
    if "last_name" in updates:
        value = updates["last_name"] or None
        if user.last_name != value:
            changes.append("last_name")
        user.last_name = value
    if "phone" in updates:
        value = updates["phone"] or None
        if user.phone != value:
            changes.append("phone")
        user.phone = value
    if "avatar_url" in updates:
        value = updates["avatar_url"]
        if user.avatar_url != value:
            changes.append("avatar_url")
        user.avatar_url = value

    db.add(user)
    db.commit()
    db.refresh(user)

    if changes:
        log_event(
            db,
            event_type="profile.update",
            category=EventCategory.profile,
            message=f"Profile updated for {user.username}",
            request=request,
            user_id=user.id,
            actor_username=user.username,
            details={"fields": changes},
        )

    return UserPublic.model_validate(user)


@router.post("/me/avatar", response_model=AvatarUploadResponse)
async def upload_avatar(
    request: Request,
    user: CurrentUser,
    db: DbSession,
    file: UploadFile = File(...),
) -> AvatarUploadResponse:
    avatar_url = await save_avatar_image(file)
    user.avatar_url = avatar_url
    db.add(user)
    db.commit()
    db.refresh(user)
    log_event(
        db,
        event_type="profile.update",
        category=EventCategory.profile,
        message=f"Profile picture uploaded for {user.username}",
        request=request,
        user_id=user.id,
        actor_username=user.username,
        details={"fields": ["avatar_url"], "source": "upload"},
    )
    return AvatarUploadResponse(avatar_url=avatar_url, user=UserPublic.model_validate(user))


@router.patch("/me/password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: UserPasswordChange,
    request: Request,
    user: CurrentUser,
    db: DbSession,
) -> None:
    if not verify_password(payload.current_password, user.password_hash):
        log_event(
            db,
            event_type="profile.password_change.failure",
            category=EventCategory.profile,
            message=f"Failed password change for {user.username}",
            request=request,
            severity=EventSeverity.warning,
            success=False,
            user_id=user.id,
            actor_username=user.username,
            details={"reason": "incorrect_current_password"},
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    user.password_hash = hash_password(payload.new_password)
    db.add(user)
    db.commit()
    revoke_all_user_sessions(db, user.id)
    log_event(
        db,
        event_type="profile.password_change",
        category=EventCategory.profile,
        message=f"Password changed for {user.username}",
        request=request,
        user_id=user.id,
        actor_username=user.username,
    )


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    payload: AccountDeleteRequest,
    request: Request,
    response: Response,
    user: CurrentUser,
    db: DbSession,
    token: SessionToken,
) -> None:
    if not verify_password(payload.password, user.password_hash):
        log_event(
            db,
            event_type="profile.delete.failure",
            category=EventCategory.profile,
            message=f"Failed account deletion for {user.username}",
            request=request,
            severity=EventSeverity.warning,
            success=False,
            user_id=user.id,
            actor_username=user.username,
            details={"reason": "incorrect_password"},
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password is incorrect")

    user_id = user.id
    username = user.username
    if token:
        revoke_session(db, token)
    db.delete(user)
    db.commit()
    response.delete_cookie(key=settings.session_cookie_name, path="/")
    log_event(
        db,
        event_type="profile.delete",
        category=EventCategory.profile,
        message=f"Account deleted: {username}",
        request=request,
        severity=EventSeverity.warning,
        user_id=user_id,
        actor_username=username,
    )
