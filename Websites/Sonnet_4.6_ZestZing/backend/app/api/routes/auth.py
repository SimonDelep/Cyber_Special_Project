from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.config import settings
from app.core.deps import get_current_user
from app.core.security import hash_password, verify_password
from app.database import get_db
from app.models.event_log import EventStatus, EventType
from app.models.user import User, UserRole
from app.schemas.user import LoginRequest, RegisterRequest, UserPublic
from app.services.auth import clear_user_session, create_user_session
from app.services.event_log import get_client_ip, log_event

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def register(
    body: RegisterRequest,
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
):
    ip = get_client_ip(request)
    if db.query(User).filter(User.username == body.username).first():
        log_event(
            db,
            EventType.REGISTER,
            EventStatus.FAILURE,
            f"Registration failed: username '{body.username}' taken",
            username=body.username,
            ip_address=ip,
        )
        raise HTTPException(status_code=400, detail="Username already taken")
    if db.query(User).filter(User.email == body.email).first():
        log_event(
            db,
            EventType.REGISTER,
            EventStatus.FAILURE,
            "Registration failed: email already registered",
            username=body.username,
            ip_address=ip,
        )
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        username=body.username,
        email=body.email,
        password_hash=hash_password(body.password),
        role=UserRole.USER,
        first_name=body.first_name,
        last_name=body.last_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    create_user_session(db, user.id, response)
    log_event(
        db,
        EventType.REGISTER,
        EventStatus.SUCCESS,
        f"New account registered: {user.username}",
        user_id=user.id,
        username=user.username,
        ip_address=ip,
    )
    return user


@router.post("/login", response_model=UserPublic)
def login(
    body: LoginRequest,
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
):
    ip = get_client_ip(request)
    user = db.query(User).filter(User.username == body.username).first()
    if not user or not verify_password(body.password, user.password_hash):
        log_event(
            db,
            EventType.LOGIN_FAILURE,
            EventStatus.FAILURE,
            f"Failed login attempt for username '{body.username}'",
            username=body.username,
            ip_address=ip,
        )
        raise HTTPException(status_code=401, detail="Invalid username or password")

    create_user_session(db, user.id, response)
    log_event(
        db,
        EventType.LOGIN_SUCCESS,
        EventStatus.SUCCESS,
        f"User logged in: {user.username}",
        user_id=user.id,
        username=user.username,
        ip_address=ip,
    )
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
    session_token: str | None = Cookie(default=None, alias=settings.session_cookie_name),
    current_user: User = Depends(get_current_user),
):
    log_event(
        db,
        EventType.LOGOUT,
        EventStatus.SUCCESS,
        f"User logged out: {current_user.username}",
        user_id=current_user.id,
        username=current_user.username,
        ip_address=get_client_ip(request),
    )
    clear_user_session(db, response, session_token)
    return None


@router.get("/me", response_model=UserPublic)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
