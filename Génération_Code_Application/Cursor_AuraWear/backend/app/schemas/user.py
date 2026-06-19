from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.user import UserRole
from app.schemas.validators import normalize_image_url


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: EmailStr
    role: UserRole
    first_name: str | None
    last_name: str | None
    phone: str | None
    avatar_url: str | None
    balance: Decimal = Decimal("0.00")
    created_at: datetime
    updated_at: datetime


class UserProfileUpdate(BaseModel):
    email: EmailStr | None = None
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    phone: str | None = Field(default=None, max_length=30)
    avatar_url: str | None = Field(default=None, max_length=500)

    @field_validator("avatar_url")
    @classmethod
    def validate_avatar_url(cls, value: str | None) -> str | None:
        return normalize_image_url(value)


class UserPasswordChange(BaseModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class AvatarUploadResponse(BaseModel):
    avatar_url: str
    user: UserPublic


class AccountDeleteRequest(BaseModel):
    password: str = Field(min_length=1, max_length=128)
