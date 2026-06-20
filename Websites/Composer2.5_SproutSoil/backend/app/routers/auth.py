from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.deps import SESSION_COOKIE, get_current_user, get_token_from_request
from app.core.event_logger import CATEGORY_AUTH, log_event
from app.core.security import (
    create_session_token,
    hash_password,
    session_expires_at,
    verify_password,
)
from app.database import get_db
from app.models.user import Session as UserSession
from app.models.user import User, UserRole
from app.schemas.user import AuthResponse, UserLogin, UserRead, UserRegister

router = APIRouter(prefix="/auth", tags=["auth"])


def _create_session(db: Session, user_id: int) -> UserSession:
    session = UserSession(
        user_id=user_id,
        token=create_session_token(),
        expires_at=session_expires_at(),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=SESSION_COOKIE,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
        path="/",
    )


def _clear_session_cookie(response: Response) -> None:
    response.delete_cookie(key=SESSION_COOKIE, path="/")


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(
    payload: UserRegister,
    response: Response,
    db: Session = Depends(get_db),
):
    if db.query(User).filter(User.username == payload.username).first():
        log_event(
            db,
            category=CATEGORY_AUTH,
            action="register_failed",
            username=payload.username,
            success=False,
            message=f"Registration failed: username '{payload.username}' already taken",
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )

    if payload.email and db.query(User).filter(User.email == payload.email).first():
        log_event(
            db,
            category=CATEGORY_AUTH,
            action="register_failed",
            username=payload.username,
            success=False,
            message=f"Registration failed: email already registered for '{payload.username}'",
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = User(
        username=payload.username,
        email=payload.email,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
        role=UserRole.USER,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    session = _create_session(db, user.id)
    _set_session_cookie(response, session.token)

    log_event(
        db,
        category=CATEGORY_AUTH,
        action="register",
        user=user,
        success=True,
        message=f"User '{user.username}' registered successfully",
    )

    return AuthResponse(
        user=UserRead.model_validate(user),
        message="Registration successful",
    )


@router.post("/login", response_model=AuthResponse)
def login(
    payload: UserLogin,
    response: Response,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.password_hash):
        log_event(
            db,
            category=CATEGORY_AUTH,
            action="login_failed",
            username=payload.username,
            success=False,
            message=f"Failed login attempt for username '{payload.username}'",
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    session = _create_session(db, user.id)
    _set_session_cookie(response, session.token)

    log_event(
        db,
        category=CATEGORY_AUTH,
        action="login",
        user=user,
        success=True,
        message=f"User '{user.username}' logged in",
    )

    return AuthResponse(
        user=UserRead.model_validate(user),
        message="Login successful",
    )


@router.post("/logout")
def logout(
    response: Response,
    db: Session = Depends(get_db),
    token: str | None = Depends(get_token_from_request),
):
    logout_user = None
    if token:
        session = db.query(UserSession).filter(UserSession.token == token).first()
        if session:
            logout_user = db.query(User).filter(User.id == session.user_id).first()
            db.delete(session)
            db.commit()

    log_event(
        db,
        category=CATEGORY_AUTH,
        action="logout",
        user=logout_user,
        success=True,
        message=f"User '{logout_user.username if logout_user else 'unknown'}' logged out",
    )

    _clear_session_cookie(response)
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserRead)
def get_me(current_user: User = Depends(get_current_user)):
    return UserRead.model_validate(current_user)
