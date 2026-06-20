from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.user import UserRole


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    role: UserRole
    full_name: Optional[str]
    bio: Optional[str]
    phone: Optional[str]
    avatar_url: Optional[str]
    balance: Decimal = Decimal("0.00")
    is_active: bool
    created_at: datetime
    updated_at: datetime


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_]+$")
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: Optional[str] = Field(default=None, max_length=120)

    @field_validator("username")
    @classmethod
    def username_lower(cls, v: str) -> str:
        return v.lower()


class LoginRequest(BaseModel):
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def username_lower(cls, v: str) -> str:
        return v.lower()


class ProfileUpdateRequest(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(default=None, max_length=120)
    bio: Optional[str] = Field(default=None, max_length=2000)
    phone: Optional[str] = Field(default=None, max_length=30)
    password: Optional[str] = Field(default=None, min_length=8, max_length=128)


class AvatarUrlRequest(BaseModel):
    avatar_url: str = Field(max_length=500)

    @field_validator("avatar_url")
    @classmethod
    def must_be_http_url(cls, v: str) -> str:
        if not v.startswith(("http://", "https://")):
            raise ValueError("Avatar URL must start with http:// or https://")
        return v


class SessionInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    last_seen_at: datetime
    expires_at: datetime
    current: bool = False
