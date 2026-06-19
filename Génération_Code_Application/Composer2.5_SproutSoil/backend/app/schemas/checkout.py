from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.user import UserRead


class CheckoutItem(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0, le=99)


class CheckoutRequest(BaseModel):
    items: list[CheckoutItem] = Field(min_length=1)


class CheckoutLineItem(BaseModel):
    product_id: int
    name: str
    quantity: int
    unit_price: Decimal
    line_total: Decimal


class CheckoutResponse(BaseModel):
    message: str
    invoice_number: str
    total: Decimal
    new_balance: Decimal
    items: list[CheckoutLineItem]
    user: UserRead
