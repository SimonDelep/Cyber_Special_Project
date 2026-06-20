from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_token
from app.db.session import get_db
from app.models.user import User, UserRole
from app.services.auth import get_session_by_token, get_user_by_id

DbSession = Annotated[Session, Depends(get_db)]


def get_session_token(
    session_token: Annotated[str | None, Cookie(alias=settings.session_cookie_name)] = None,
) -> str | None:
    return session_token


def get_current_user(
    db: DbSession,
    token: Annotated[str | None, Depends(get_session_token)],
) -> User:
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    session = get_session_by_token(db, token)
    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired or invalid")
    user = get_user_by_id(db, session.user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User inactive")
    return user


def get_current_user_optional(
    db: DbSession,
    token: Annotated[str | None, Depends(get_session_token)],
) -> User | None:
    if not token:
        return None
    session = get_session_by_token(db, token)
    if not session:
        return None
    user = get_user_by_id(db, session.user_id)
    if not user or not user.is_active:
        return None
    return user


def require_admin(user: Annotated[User, Depends(get_current_user)]) -> User:
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalUser = Annotated[User | None, Depends(get_current_user_optional)]
AdminUser = Annotated[User, Depends(require_admin)]


def current_token_hash(token: Annotated[str | None, Depends(get_session_token)]) -> str | None:
    return hash_token(token) if token else None
