from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.config import settings
from app.core.deps import SESSION_COOKIE, get_current_session, get_current_user
from app.core.security import (
    generate_session_token,
    hash_password,
    hash_session_token,
    session_expires_at,
    verify_password,
)
from app.database import get_db
from app.models.system_event import EventStatus, EventType
from app.models.user import User, UserRole
from app.models.user_session import UserSession
from app.schemas.user import LoginRequest, RegisterRequest, SessionInfo, UserPublic
from app.services.event_log import log_event

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_session_cookie(response: Response, token: str) -> None:
    max_age = settings.session_expire_days * 24 * 60 * 60
    response.set_cookie(
        key=SESSION_COOKIE,
        value=token,
        httponly=True,
        max_age=max_age,
        samesite="lax",
        secure=settings.cookie_secure,
        path="/",
    )


def _clear_session_cookie(response: Response) -> None:
    response.delete_cookie(key=SESSION_COOKIE, path="/")


def _create_session(db: Session, user_id: int) -> str:
    token = generate_session_token()
    session = UserSession(
        user_id=user_id,
        token_hash=hash_session_token(token),
        expires_at=session_expires_at(settings.session_expire_days),
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )
    db.add(session)
    db.commit()
    return token


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    request: Request,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
) -> User:
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=UserRole.USER,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = _create_session(db, user.id)
    _set_session_cookie(response, token)
    log_event(
        db,
        event_type=EventType.REGISTER,
        status=EventStatus.SUCCESS,
        message=f"New account registered: {user.username}",
        user_id=user.id,
        username=user.username,
        request=request,
    )
    return user


@router.post("/login", response_model=UserPublic)
def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
) -> User:
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        log_event(
            db,
            event_type=EventType.LOGIN_ATTEMPT,
            status=EventStatus.FAILURE,
            message=f"Failed login for username '{payload.username}'",
            username=payload.username,
            metadata={"reason": "invalid_credentials"},
            request=request,
        )
        raise HTTPException(status_code=401, detail="Invalid username or password")
    if not user.is_active:
        log_event(
            db,
            event_type=EventType.LOGIN_ATTEMPT,
            status=EventStatus.FAILURE,
            message=f"Login blocked for disabled account '{user.username}'",
            user_id=user.id,
            username=user.username,
            metadata={"reason": "account_disabled"},
            request=request,
        )
        raise HTTPException(status_code=403, detail="Account is disabled")

    token = _create_session(db, user.id)
    _set_session_cookie(response, token)
    log_event(
        db,
        event_type=EventType.LOGIN_ATTEMPT,
        status=EventStatus.SUCCESS,
        message=f"Successful login for {user.username}",
        user_id=user.id,
        username=user.username,
        request=request,
    )
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    request: Request,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
    session: Annotated[UserSession, Depends(get_current_session)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    session.is_active = False
    db.commit()
    _clear_session_cookie(response)
    log_event(
        db,
        event_type=EventType.LOGOUT,
        status=EventStatus.INFO,
        message=f"User logged out: {current_user.username}",
        user_id=current_user.id,
        username=current_user.username,
        request=request,
    )


@router.get("/me", response_model=UserPublic)
def get_me(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    return current_user


@router.get("/sessions", response_model=list[SessionInfo])
def list_sessions(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    current_session: Annotated[UserSession, Depends(get_current_session)],
) -> list[SessionInfo]:
    sessions = (
        db.query(UserSession)
        .filter(
            UserSession.user_id == current_user.id,
            UserSession.is_active.is_(True),
        )
        .order_by(UserSession.created_at.desc())
        .all()
    )
    return [
        SessionInfo(
            id=s.id,
            created_at=s.created_at,
            expires_at=s.expires_at,
            is_current=s.id == current_session.id,
        )
        for s in sessions
        if not s.is_expired
    ]


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_session(
    session_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    session = (
        db.query(UserSession)
        .filter(
            UserSession.id == session_id,
            UserSession.user_id == current_user.id,
        )
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.is_active = False
    db.commit()
