from fastapi import APIRouter, Cookie, Depends, File, HTTPException, Request, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.config import settings
from app.core.deps import get_current_user
from app.core.security import hash_password, verify_password
from app.database import get_db
from app.models.event_log import EventStatus, EventType
from app.models.user import User
from app.schemas.user import ProfilePictureUrlRequest, ProfileUpdateRequest, UserPublic
from app.services.event_log import get_client_ip, log_event
from app.services.images import save_image_file, validate_image_url

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserPublic)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserPublic)
def update_profile(
    body: ProfileUpdateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    changes: list[str] = []

    if body.email and body.email != current_user.email:
        existing = db.query(User).filter(User.email == body.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        current_user.email = body.email
        changes.append("email")

    if body.first_name is not None:
        current_user.first_name = body.first_name or None
        changes.append("first_name")
    if body.last_name is not None:
        current_user.last_name = body.last_name or None
        changes.append("last_name")

    if body.new_password:
        if not body.current_password:
            raise HTTPException(
                status_code=400,
                detail="Current password required to set a new password",
            )
        if not verify_password(body.current_password, current_user.password_hash):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        current_user.password_hash = hash_password(body.new_password)
        changes.append("password")

    db.commit()
    db.refresh(current_user)

    if changes:
        log_event(
            db,
            EventType.PROFILE_UPDATE,
            EventStatus.SUCCESS,
            f"Profile updated by {current_user.username}",
            user_id=current_user.id,
            username=current_user.username,
            ip_address=get_client_ip(request),
            details={"fields_changed": changes},
        )

    return current_user


@router.put("/me/avatar-url", response_model=UserPublic)
def set_avatar_url(
    body: ProfilePictureUrlRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.profile_picture_url = validate_image_url(body.profile_picture_url)
    db.commit()
    db.refresh(current_user)
    log_event(
        db,
        EventType.AVATAR_UPDATE,
        EventStatus.SUCCESS,
        f"Avatar URL set by {current_user.username}",
        user_id=current_user.id,
        username=current_user.username,
        ip_address=get_client_ip(request),
        details={"method": "url"},
    )
    return current_user


@router.post("/me/avatar", response_model=UserPublic)
async def upload_avatar(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    url = await save_image_file(file, "avatars", str(current_user.id))
    current_user.profile_picture_url = url
    db.commit()
    db.refresh(current_user)
    log_event(
        db,
        EventType.AVATAR_UPDATE,
        EventStatus.SUCCESS,
        f"Avatar uploaded by {current_user.username}",
        user_id=current_user.id,
        username=current_user.username,
        ip_address=get_client_ip(request),
        details={"method": "file_upload"},
    )
    return current_user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_profile(
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    session_token: str | None = Cookie(default=None, alias=settings.session_cookie_name),
):
    from app.services.auth import clear_user_session

    username = current_user.username
    user_id = current_user.id
    log_event(
        db,
        EventType.PROFILE_DELETE,
        EventStatus.SUCCESS,
        f"Account deleted: {username}",
        user_id=user_id,
        username=username,
        ip_address=get_client_ip(request),
    )
    db.delete(current_user)
    db.commit()
    clear_user_session(db, response, session_token)
    return None
