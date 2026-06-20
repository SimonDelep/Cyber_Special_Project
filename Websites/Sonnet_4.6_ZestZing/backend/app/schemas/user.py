from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole


class UserPublic(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: UserRole
    first_name: str | None
    last_name: str | None
    profile_picture_url: str | None
    balance: Decimal
    created_at: datetime

    model_config = {"from_attributes": True}


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_]+$")
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)


class LoginRequest(BaseModel):
    username: str
    password: str


class ProfileUpdateRequest(BaseModel):
    email: EmailStr | None = None
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    current_password: str | None = None
    new_password: str | None = Field(default=None, min_length=8, max_length=128)


class ProfilePictureUrlRequest(BaseModel):
    profile_picture_url: str = Field(max_length=500)


class AdminUserSummary(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: UserRole
    first_name: str | None
    last_name: str | None
    balance: Decimal
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminUserUpdate(BaseModel):
    email: EmailStr | None = None
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    role: UserRole | None = None
    balance: Decimal | None = Field(default=None, ge=0, decimal_places=2)


class AdminBalanceAdjust(BaseModel):
    adjustment: Decimal = Field(description="Amount to add (negative to subtract)")
