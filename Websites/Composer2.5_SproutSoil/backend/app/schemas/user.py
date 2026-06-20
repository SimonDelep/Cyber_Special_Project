from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.user import UserRole


class UserRegister(BaseModel):
    username: str = Field(min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_]+$")
    password: str = Field(min_length=8, max_length=128)
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(default=None, max_length=120)


class UserLogin(BaseModel):
    username: str
    password: str


class UserProfileUpdate(BaseModel):
    username: Optional[str] = Field(default=None, min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_]+$")
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(default=None, max_length=120)
    profile_picture_url: Optional[str] = Field(default=None, max_length=500)


class ProfilePictureUrlUpdate(BaseModel):
    profile_picture_url: str = Field(max_length=500)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: Optional[str]
    full_name: Optional[str]
    profile_picture_url: Optional[str]
    balance: Decimal
    role: UserRole
    created_at: datetime


class AuthResponse(BaseModel):
    user: UserRead
    message: str
