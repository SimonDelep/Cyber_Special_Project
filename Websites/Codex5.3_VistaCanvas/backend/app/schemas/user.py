from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, EmailStr, Field, model_validator

from app.models.user import UserRole


class UserPublic(BaseModel):
    id: int
    username: str
    email: str
    role: UserRole
    full_name: str | None
    bio: str | None
    avatar_url: str | None
    balance: Decimal
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminUserUpdate(BaseModel):
    # Plain str: admin may edit dev/seed addresses (e.g. .local) rejected by EmailStr
    email: str | None = Field(default=None, max_length=255)
    full_name: str | None = Field(default=None, max_length=120)
    bio: str | None = Field(default=None, max_length=2000)
    role: UserRole | None = None
    is_active: bool | None = None
    balance: Decimal | None = Field(default=None, ge=0)


class BalanceAdjustRequest(BaseModel):
    adjustment: Decimal | None = None
    balance: Decimal | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def require_one_field(self) -> "BalanceAdjustRequest":
        if self.adjustment is None and self.balance is None:
            raise ValueError("Provide either adjustment or balance")
        if self.adjustment is not None and self.balance is not None:
            raise ValueError("Provide only one of adjustment or balance")
        return self


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_]+$")
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=120)


class LoginRequest(BaseModel):
    username: str
    password: str


class ProfileUpdateRequest(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = Field(default=None, max_length=120)
    bio: str | None = Field(default=None, max_length=2000)
    password: str | None = Field(default=None, min_length=8, max_length=128)


class AvatarUrlRequest(BaseModel):
    avatar_url: str = Field(max_length=500)


class DeleteAccountRequest(BaseModel):
    password: str


class SessionInfo(BaseModel):
    id: int
    created_at: datetime
    expires_at: datetime
    is_current: bool

    model_config = {"from_attributes": True}
