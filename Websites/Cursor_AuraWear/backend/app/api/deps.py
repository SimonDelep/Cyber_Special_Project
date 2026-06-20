from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User, UserRole
from app.services.auth import get_valid_session

DbSession = Annotated[Session, Depends(get_db)]


def get_session_token(
    aurawear_session: Annotated[str | None, Cookie(alias=settings.session_cookie_name)] = None,
) -> str | None:
    return aurawear_session


SessionToken = Annotated[str | None, Depends(get_session_token)]


def get_current_user(db: DbSession, token: SessionToken) -> User:
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    session = get_valid_session(db, token)
    if not session or not session.user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired or invalid")
    return session.user


def get_current_user_optional(db: DbSession, token: SessionToken) -> User | None:
    if not token:
        return None
    session = get_valid_session(db, token)
    return session.user if session else None


CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalUser = Annotated[User | None, Depends(get_current_user_optional)]


def require_roles(*roles: UserRole):
    def checker(user: CurrentUser) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user

    return checker


AdminUser = Annotated[User, Depends(require_roles(UserRole.admin))]
