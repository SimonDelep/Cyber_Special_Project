from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

from app.models.user import UserRole
from app.schemas.product import ProductRead
from app.schemas.user import UserPublic


class UserAdminRead(UserPublic):
    balance: Decimal


class AdminUserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(default=None, max_length=120)
    phone: Optional[str] = Field(default=None, max_length=30)
    bio: Optional[str] = Field(default=None, max_length=2000)
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class BalanceAdjustRequest(BaseModel):
    """Set an absolute balance or apply a signed adjustment (not both)."""

    balance: Optional[Decimal] = Field(default=None, ge=0)
    adjustment: Optional[Decimal] = None
    note: Optional[str] = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def exactly_one_mode(self) -> "BalanceAdjustRequest":
        has_balance = self.balance is not None
        has_adjustment = self.adjustment is not None
        if has_balance == has_adjustment:
            raise ValueError("Provide either 'balance' (set absolute) or 'adjustment' (add/subtract).")
        return self


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    slug: Optional[str] = Field(default=None, max_length=200, pattern=r"^[a-z0-9-]+$")
    category: str = Field(min_length=1, max_length=80)
    description: str = Field(default="", max_length=5000)
    price: Decimal = Field(gt=0)
    image_url: Optional[str] = Field(default=None, max_length=500)


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    slug: Optional[str] = Field(default=None, max_length=200, pattern=r"^[a-z0-9-]+$")
    category: Optional[str] = Field(default=None, min_length=1, max_length=80)
    description: Optional[str] = Field(default=None, max_length=5000)
    price: Optional[Decimal] = Field(default=None, gt=0)
    image_url: Optional[str] = Field(default=None, max_length=500)


class RoleUpdateRequest(BaseModel):
    role: UserRole


class ProductImportRowError(BaseModel):
    row: int
    message: str


class ProductImportResult(BaseModel):
    created: int
    failed: int
    errors: list[ProductImportRowError]
