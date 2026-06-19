from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from app.api.deps import CurrentUser, DbSession, OptionalUser, current_token_hash, get_session_token
from app.core.config import settings
from app.core.request_utils import get_client_ip
from app.core.security import hash_token
from app.models.system_log import EventType
from app.models.user import UserRole
from app.schemas.user import LoginRequest, RegisterRequest, SessionInfo, UserPublic
from app.services.auth import (
    AuthError,
    DuplicateUserError,
    authenticate_user,
    create_session,
    list_user_sessions,
    register_user,
    revoke_session,
)
from app.services.system_log import log_event
from app.services.user import delete_user

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=settings.session_expire_days * 24 * 3600,
        path="/",
    )


def _clear_session_cookie(response: Response) -> None:
    response.set_cookie(
        key=settings.session_cookie_name,
        value="",
        max_age=0,
        httponly=True,
        samesite="lax",
        path="/",
    )


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def register(
    body: RegisterRequest,
    request: Request,
    response: Response,
    db: DbSession,
) -> UserPublic:
    ip = get_client_ip(request)
    try:
        user = register_user(
            db,
            username=body.username,
            email=body.email,
            password=body.password,
            full_name=body.full_name,
            role=UserRole.USER,
        )
    except DuplicateUserError as e:
        log_event(
            db,
            EventType.REGISTER.value,
            message=f"Registration failed for {body.username}",
            success=False,
            username=body.username,
            ip_address=ip,
            details={"error": str(e)},
        )
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e)) from e

    token, _ = create_session(db, user)
    _set_session_cookie(response, token)
    log_event(
        db,
        EventType.REGISTER.value,
        message=f"New account registered: {user.username}",
        user=user,
        ip_address=ip,
        details={"email": user.email},
    )
    return UserPublic.model_validate(user)


@router.post("/login", response_model=UserPublic)
def login(body: LoginRequest, request: Request, response: Response, db: DbSession) -> UserPublic:
    ip = get_client_ip(request)
    try:
        user = authenticate_user(db, body.username, body.password)
    except AuthError as e:
        log_event(
            db,
            EventType.LOGIN_FAILURE.value,
            message=f"Failed login attempt for {body.username}",
            success=False,
            username=body.username,
            ip_address=ip,
            details={"reason": str(e)},
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e)) from e

    token, _ = create_session(db, user)
    _set_session_cookie(response, token)
    log_event(
        db,
        EventType.LOGIN_SUCCESS.value,
        message=f"User {user.username} logged in",
        user=user,
        ip_address=ip,
    )
    return UserPublic.model_validate(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    request: Request,
    response: Response,
    db: DbSession,
    user: OptionalUser = None,
    token: str | None = Depends(get_session_token),
) -> Response:
    ip = get_client_ip(request)
    if token:
        revoke_session(db, token)
    _clear_session_cookie(response)
    if user:
        log_event(
            db,
            EventType.LOGOUT.value,
            message=f"User {user.username} logged out",
            user=user,
            ip_address=ip,
        )
    return response


@router.get("/me", response_model=UserPublic)
def me(user: CurrentUser) -> UserPublic:
    return UserPublic.model_validate(user)


@router.get("/sessions", response_model=list[SessionInfo])
def my_sessions(
    user: CurrentUser,
    db: DbSession,
    token_hash: str | None = Depends(current_token_hash),
) -> list[SessionInfo]:
    sessions = list_user_sessions(db, user.id)
    result = []
    for s in sessions:
        info = SessionInfo.model_validate(s)
        info.current = token_hash is not None and s.token_hash == token_hash
        result.append(info)
    return result


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    user: CurrentUser,
    request: Request,
    db: DbSession,
    response: Response,
    token: str | None = Depends(get_session_token),
) -> Response:
    ip = get_client_ip(request)
    username = user.username
    if token:
        revoke_session(db, token)
    delete_user(db, user)
    _clear_session_cookie(response)
    log_event(
        db,
        EventType.PROFILE_UPDATE.value,
        message=f"Account deleted: {username}",
        success=True,
        username=username,
        ip_address=ip,
        details={"action": "account_delete"},
    )
    return response
