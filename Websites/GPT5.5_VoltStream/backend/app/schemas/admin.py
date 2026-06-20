from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class AdminUserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    is_admin: bool
    balance_cents: int
    created_at: datetime


class AdminUserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=120)
    email: Optional[EmailStr] = None
    is_admin: Optional[bool] = None
    balance_cents: Optional[int] = Field(None, ge=0)


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1)
    category: str = Field(pattern=r"^(keyboard|mouse|desk_mat)$")
    price_cents: int = Field(ge=0)
    image_url: Optional[str] = Field(None, max_length=500)


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1)
    category: Optional[str] = Field(None, pattern=r"^(keyboard|mouse|desk_mat)$")
    price_cents: Optional[int] = Field(None, ge=0)
    image_url: Optional[str] = Field(None, max_length=500)


class ProductImportResult(BaseModel):
    created: int
    failed: int
    errors: list[str]
    created_names: list[str]
