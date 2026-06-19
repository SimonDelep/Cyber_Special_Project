from datetime import datetime, timezone

from fastapi import Cookie, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import Session as UserSession
from app.models.user import User, UserRole

SESSION_COOKIE = "sproutsoil_session"


def get_token_from_request(
    sproutsoil_session: str | None = Cookie(default=None, alias=SESSION_COOKIE),
    authorization: str | None = Header(default=None),
) -> str | None:
    if sproutsoil_session:
        return sproutsoil_session
    if authorization and authorization.lower().startswith("bearer "):
        return authorization[7:].strip()
    return None


def _resolve_user(db: Session, token: str) -> User | None:
    session = db.query(UserSession).filter(UserSession.token == token).first()
    if not session:
        return None

    expires = session.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)

    if expires < datetime.now(timezone.utc):
        db.delete(session)
        db.commit()
        return None

    return db.query(User).filter(User.id == session.user_id).first()


def get_current_user(
    db: Session = Depends(get_db),
    token: str | None = Depends(get_token_from_request),
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    user = _resolve_user(db, token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
        )
    return user


def get_current_user_optional(
    db: Session = Depends(get_db),
    token: str | None = Depends(get_token_from_request),
) -> User | None:
    if not token:
        return None
    return _resolve_user(db, token)


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required",
        )
    return current_user
