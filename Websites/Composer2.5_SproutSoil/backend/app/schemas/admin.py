from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole


class AdminUserUpdate(BaseModel):
    username: Optional[str] = Field(default=None, min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_]+$")
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(default=None, max_length=120)
    role: Optional[UserRole] = None
    profile_picture_url: Optional[str] = Field(default=None, max_length=500)


class BalanceAdjust(BaseModel):
    amount: Decimal
    mode: Literal["set", "add"] = "add"
