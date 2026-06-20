from fastapi import Response
from sqlalchemy.orm import Session

from app.config import settings
from app.core.security import (
    generate_session_token,
    hash_session_token,
    session_expires_at,
)
from app.models.user import Session as UserSession


def create_user_session(db: Session, user_id: int, response: Response) -> str:
    token = generate_session_token()
    session = UserSession(
        user_id=user_id,
        token_hash=hash_session_token(token),
        expires_at=session_expires_at(),
    )
    db.add(session)
    db.commit()

    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=settings.session_expire_days * 24 * 3600,
        path="/",
    )
    return token


def clear_user_session(
    db: Session,
    response: Response,
    session_token: str | None,
) -> None:
    if session_token:
        token_hash = hash_session_token(session_token)
        db.query(UserSession).filter(UserSession.token_hash == token_hash).delete()
        db.commit()

    response.delete_cookie(key=settings.session_cookie_name, path="/")
