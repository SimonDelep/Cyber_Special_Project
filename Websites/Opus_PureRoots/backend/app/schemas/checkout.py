from decimal import Decimal

from pydantic import BaseModel, Field


class CheckoutItemRequest(BaseModel):
    product_id: int
    quantity: int = Field(ge=1, le=99)


class CheckoutRequest(BaseModel):
    items: list[CheckoutItemRequest] = Field(min_length=1)


class CheckoutLineItem(BaseModel):
    product_id: int
    product_name: str
    quantity: int
    unit_price: Decimal
    line_total: Decimal


class CheckoutResponse(BaseModel):
    order_id: int
    total: Decimal
    new_balance: Decimal
    items: list[CheckoutLineItem]
    message: str
