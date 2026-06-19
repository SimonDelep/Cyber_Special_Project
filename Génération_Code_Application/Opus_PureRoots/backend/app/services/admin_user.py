from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.admin import AdminUserUpdate, BalanceAdjustRequest
from app.services.auth import DuplicateUserError, get_user_by_email


class AdminUserError(Exception):
    pass


def admin_update_user(db: Session, user: User, data: AdminUserUpdate) -> User:
    if data.email is not None and data.email.lower() != user.email:
        existing = get_user_by_email(db, data.email)
        if existing and existing.id != user.id:
            raise DuplicateUserError("Email already in use")
        user.email = data.email.lower()

    if data.full_name is not None:
        user.full_name = data.full_name or None
    if data.phone is not None:
        user.phone = data.phone or None
    if data.bio is not None:
        user.bio = data.bio or None
    if data.is_active is not None:
        user.is_active = data.is_active
    if data.role is not None:
        user.role = data.role

    db.commit()
    db.refresh(user)
    return user


def adjust_user_balance(db: Session, user: User, data: BalanceAdjustRequest) -> User:
    if data.balance is not None:
        user.balance = Decimal(data.balance)
    elif data.adjustment is not None:
        current = Decimal(user.balance if user.balance is not None else 0)
        new_balance = current + Decimal(data.adjustment)
        if new_balance < 0:
            raise AdminUserError("Balance cannot be negative")
        user.balance = new_balance

    db.commit()
    db.refresh(user)
    return user
