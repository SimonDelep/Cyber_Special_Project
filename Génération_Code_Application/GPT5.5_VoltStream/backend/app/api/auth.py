from fastapi import APIRouter, Depends, HTTPException, Request, status

from sqlalchemy.orm import Session



from app.config import settings

from app.core.deps import get_current_user

from app.core.security import create_access_token, hash_password, verify_password

from app.database import get_db

from app.models.user import User

from app.schemas.auth import TokenResponse, UserLogin, UserRead, UserRegister

from app.services.event_log import (

    EVENT_LOGIN_FAILURE,

    EVENT_LOGIN_SUCCESS,

    EVENT_REGISTER_FAILURE,

    EVENT_REGISTER_SUCCESS,

    client_ip,

    log_event,

)



router = APIRouter(prefix="/auth", tags=["auth"])





@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)

def register(payload: UserRegister, request: Request, db: Session = Depends(get_db)):

    ip = client_ip(request)

    if db.query(User).filter(User.email == payload.email).first():

        log_event(

            event_type=EVENT_REGISTER_FAILURE,

            message=f"Registration failed: email already registered ({payload.email})",

            success=False,

            actor_email=payload.email,

            ip_address=ip,

            details={"reason": "email_already_registered"},

        )

        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(

        email=payload.email,

        full_name=payload.full_name,

        hashed_password=hash_password(payload.password),

        balance_cents=settings.default_user_balance_cents,

    )

    db.add(user)

    db.commit()

    db.refresh(user)

    log_event(

        event_type=EVENT_REGISTER_SUCCESS,

        message=f"New account registered: {user.email}",

        actor_user_id=user.id,

        actor_email=user.email,

        ip_address=ip,

        details={"user_id": user.id},

    )

    token = create_access_token(user.email)

    return TokenResponse(access_token=token, user=UserRead.model_validate(user))





@router.post("/login", response_model=TokenResponse)

def login(payload: UserLogin, request: Request, db: Session = Depends(get_db)):

    ip = client_ip(request)

    user = db.query(User).filter(User.email == payload.email).first()

    if not user or not verify_password(payload.password, user.hashed_password):

        log_event(

            event_type=EVENT_LOGIN_FAILURE,

            message=f"Failed login attempt for {payload.email}",

            success=False,

            actor_email=payload.email,

            ip_address=ip,

            details={"reason": "invalid_credentials"},

        )

        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    log_event(

        event_type=EVENT_LOGIN_SUCCESS,

        message=f"User signed in: {user.email}",

        actor_user_id=user.id,

        actor_email=user.email,

        ip_address=ip,

    )

    token = create_access_token(user.email)

    return TokenResponse(access_token=token, user=UserRead.model_validate(user))





@router.get("/me", response_model=UserRead)

def me(user: User = Depends(get_current_user)):

    return user


