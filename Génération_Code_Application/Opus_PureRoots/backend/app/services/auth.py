from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import (
    create_session_token,
    hash_password,
    hash_token,
    session_expires_at,
    verify_password,
)
from app.models.user import User, UserRole, UserSession


class AuthError(Exception):
    pass


class DuplicateUserError(AuthError):
    pass


def get_user_by_username(db: Session, username: str) -> User | None:
    return db.scalar(select(User).where(User.username == username.lower()))


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email.lower()))


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def register_user(
    db: Session,
    *,
    username: str,
    email: str,
    password: str,
    full_name: str | None = None,
    role: UserRole = UserRole.USER,
) -> User:
    if get_user_by_username(db, username):
        raise DuplicateUserError("Username already taken")
    if get_user_by_email(db, email):
        raise DuplicateUserError("Email already registered")

    user = User(
        username=username.lower(),
        email=email.lower(),
        password_hash=hash_password(password),
        full_name=full_name,
        role=role,
        balance=Decimal("25.00") if role == UserRole.USER else Decimal("0.00"),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, username: str, password: str) -> User:
    user = get_user_by_username(db, username)
    if not user or not user.is_active:
        raise AuthError("Invalid username or password")
    if not verify_password(password, user.password_hash):
        raise AuthError("Invalid username or password")
    return user


def create_session(db: Session, user: User) -> tuple[str, UserSession]:
    token = create_session_token()
    session = UserSession(
        user_id=user.id,
        token_hash=hash_token(token),
        expires_at=session_expires_at(),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return token, session


def get_session_by_token(db: Session, token: str) -> UserSession | None:
    token_hash = hash_token(token)
    session = db.scalar(
        select(UserSession).where(
            UserSession.token_hash == token_hash,
            UserSession.expires_at > datetime.now(timezone.utc),
        )
    )
    if session:
        session.last_seen_at = datetime.now(timezone.utc)
        db.commit()
    return session


def revoke_session(db: Session, token: str) -> None:
    token_hash = hash_token(token)
    session = db.scalar(select(UserSession).where(UserSession.token_hash == token_hash))
    if session:
        db.delete(session)
        db.commit()


def revoke_all_sessions(db: Session, user_id: int, except_token: str | None = None) -> None:
    except_hash = hash_token(except_token) if except_token else None
    sessions = db.scalars(select(UserSession).where(UserSession.user_id == user_id)).all()
    for s in sessions:
        if except_hash and s.token_hash == except_hash:
            continue
        db.delete(s)
    db.commit()


def list_user_sessions(db: Session, user_id: int, current_token_hash: str | None = None) -> list[UserSession]:
    return list(
        db.scalars(
            select(UserSession)
            .where(UserSession.user_id == user_id)
            .order_by(UserSession.last_seen_at.desc())
        )
    )
