from decimal import Decimal

from pydantic import BaseModel, EmailStr, Field, model_validator

from app.models.user import UserRole
from app.schemas.user import UserPublic


class AdminUserUpdate(BaseModel):
    email: EmailStr | None = None
    role: UserRole | None = None
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    phone: str | None = Field(default=None, max_length=30)


class BalanceUpdate(BaseModel):
    adjustment: Decimal | None = Field(
        default=None,
        description="Amount to add (positive) or subtract (negative)",
    )
    set_balance: Decimal | None = Field(default=None, ge=0, decimal_places=2, max_digits=10)
    reason: str | None = Field(default=None, max_length=255)

    @model_validator(mode="after")
    def require_one_operation(self) -> "BalanceUpdate":
        if self.adjustment is None and self.set_balance is None:
            raise ValueError("Provide either adjustment or set_balance")
        if self.adjustment is not None and self.set_balance is not None:
            raise ValueError("Provide only one of adjustment or set_balance")
        return self


class AdminUserPublic(UserPublic):
    balance: Decimal
