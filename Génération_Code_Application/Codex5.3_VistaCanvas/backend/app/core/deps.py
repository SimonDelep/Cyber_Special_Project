from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_session_token
from app.database import get_db
from app.models.user import User, UserRole
from app.models.user_session import UserSession

SESSION_COOKIE = "vistacanvas_session"


def get_current_session(
    db: Annotated[Session, Depends(get_db)],
    vistacanvas_session: Annotated[str | None, Cookie(alias=SESSION_COOKIE)] = None,
) -> UserSession:
    if not vistacanvas_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    token_hash = hash_session_token(vistacanvas_session)
    session = (
        db.query(UserSession)
        .filter(
            UserSession.token_hash == token_hash,
            UserSession.is_active.is_(True),
        )
        .first()
    )
    if not session or session.is_expired:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid",
        )
    return session


def get_current_user(
    db: Annotated[Session, Depends(get_db)],
    session: Annotated[UserSession, Depends(get_current_session)],
) -> User:
    user = db.query(User).filter(User.id == session.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    return user


def require_admin(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required",
        )
    return current_user


def get_optional_user(
    db: Annotated[Session, Depends(get_db)],
    vistacanvas_session: Annotated[str | None, Cookie(alias=SESSION_COOKIE)] = None,
) -> User | None:
    if not vistacanvas_session:
        return None
    try:
        session = get_current_session(db, vistacanvas_session)
        user = db.query(User).filter(User.id == session.user_id).first()
        if not user or not user.is_active:
            return None
        return user
    except HTTPException:
        return None
