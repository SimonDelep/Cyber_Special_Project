from fastapi import APIRouter, File, HTTPException, Request, UploadFile, status

from app.api.deps import CurrentUser, DbSession
from app.core.request_utils import get_client_ip
from app.models.system_log import EventType
from app.schemas.user import AvatarUrlRequest, ProfileUpdateRequest, UserPublic
from app.services.auth import DuplicateUserError
from app.services.system_log import log_event
from app.services.user import save_avatar_file, set_avatar_url, update_profile

router = APIRouter(prefix="/users", tags=["users"])


def _profile_change_details(body: ProfileUpdateRequest) -> dict:
    fields = []
    if body.email is not None:
        fields.append("email")
    if body.full_name is not None:
        fields.append("full_name")
    if body.bio is not None:
        fields.append("bio")
    if body.phone is not None:
        fields.append("phone")
    if body.password:
        fields.append("password")
    return {"fields_updated": fields}


@router.get("/me", response_model=UserPublic)
def get_profile(user: CurrentUser) -> UserPublic:
    return UserPublic.model_validate(user)


@router.patch("/me", response_model=UserPublic)
def update_my_profile(
    body: ProfileUpdateRequest,
    request: Request,
    user: CurrentUser,
    db: DbSession,
) -> UserPublic:
    ip = get_client_ip(request)
    try:
        updated = update_profile(
            db,
            user,
            email=body.email,
            full_name=body.full_name,
            bio=body.bio,
            phone=body.phone,
            password=body.password,
        )
    except DuplicateUserError as e:
        log_event(
            db,
            EventType.PROFILE_UPDATE.value,
            message=f"Profile update failed for {user.username}",
            user=user,
            ip_address=ip,
            success=False,
            details={"error": str(e), **_profile_change_details(body)},
        )
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e)) from e

    log_event(
        db,
        EventType.PROFILE_UPDATE.value,
        message=f"Profile updated for {user.username}",
        user=user,
        ip_address=ip,
        details=_profile_change_details(body),
    )
    return UserPublic.model_validate(updated)


@router.put("/me/avatar-url", response_model=UserPublic)
def set_avatar_from_url(
    body: AvatarUrlRequest,
    request: Request,
    user: CurrentUser,
    db: DbSession,
) -> UserPublic:
    ip = get_client_ip(request)
    updated = set_avatar_url(db, user, body.avatar_url)
    log_event(
        db,
        EventType.PROFILE_UPDATE.value,
        message=f"Avatar URL updated for {user.username}",
        user=user,
        ip_address=ip,
        details={"avatar": "url"},
    )
    return UserPublic.model_validate(updated)


@router.post("/me/avatar", response_model=UserPublic)
async def upload_avatar(
    request: Request,
    user: CurrentUser,
    db: DbSession,
    file: UploadFile = File(...),
) -> UserPublic:
    ip = get_client_ip(request)
    content = await file.read()
    content_type = file.content_type or "application/octet-stream"
    try:
        updated = save_avatar_file(db, user, content, content_type)
    except ValueError as e:
        log_event(
            db,
            EventType.PROFILE_UPDATE.value,
            message=f"Avatar upload failed for {user.username}",
            user=user,
            ip_address=ip,
            success=False,
            details={"error": str(e)},
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e

    log_event(
        db,
        EventType.PROFILE_UPDATE.value,
        message=f"Avatar uploaded for {user.username}",
        user=user,
        ip_address=ip,
        details={"avatar": "file"},
    )
    return UserPublic.model_validate(updated)
