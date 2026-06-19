from fastapi import APIRouter, HTTPException, Request, Response, status

from app.api.deps import CurrentUser, DbSession, OptionalUser, SessionToken
from app.core.config import settings
from app.models.system_event import EventCategory, EventSeverity
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest
from app.schemas.user import UserPublic
from app.services.auth import authenticate_user, create_session, create_user, revoke_session
from app.services.events import log_event

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=settings.session_expire_days * 86400,
        path="/",
    )


def _clear_session_cookie(response: Response) -> None:
    response.delete_cookie(key=settings.session_cookie_name, path="/")


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    request: Request,
    response: Response,
    db: DbSession,
) -> AuthResponse:
    user = create_user(db, payload)
    session = create_session(db, user)
    _set_session_cookie(response, session.token)
    log_event(
        db,
        event_type="auth.register",
        category=EventCategory.auth,
        message=f"New account registered: {user.username}",
        request=request,
        user_id=user.id,
        actor_username=user.username,
        details={"email": user.email},
    )
    return AuthResponse(user=UserPublic.model_validate(user), message="Registration successful")


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, request: Request, response: Response, db: DbSession) -> AuthResponse:
    username = payload.username.lower()
    try:
        user = authenticate_user(db, payload.username, payload.password)
    except HTTPException as exc:
        if exc.status_code == status.HTTP_401_UNAUTHORIZED:
            log_event(
                db,
                event_type="auth.login.failure",
                category=EventCategory.auth,
                message=f"Failed login attempt for username: {username}",
                request=request,
                severity=EventSeverity.warning,
                success=False,
                actor_username=username,
                details={"reason": "invalid_credentials"},
            )
        raise

    session = create_session(db, user)
    _set_session_cookie(response, session.token)
    log_event(
        db,
        event_type="auth.login.success",
        category=EventCategory.auth,
        message=f"User logged in: {user.username}",
        request=request,
        user_id=user.id,
        actor_username=user.username,
    )
    return AuthResponse(user=UserPublic.model_validate(user), message="Login successful")


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    request: Request,
    response: Response,
    db: DbSession,
    token: SessionToken,
    user: OptionalUser,
) -> None:
    if token:
        revoke_session(db, token)
    _clear_session_cookie(response)
    log_event(
        db,
        event_type="auth.logout",
        category=EventCategory.auth,
        message=f"User logged out: {user.username if user else 'unknown'}",
        request=request,
        user_id=user.id if user else None,
        actor_username=user.username if user else None,
    )


@router.get("/me", response_model=UserPublic)
def get_me(user: CurrentUser) -> UserPublic:
    return UserPublic.model_validate(user)
