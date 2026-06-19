from decimal import Decimal

from pydantic import BaseModel, Field


class CartItemRequest(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0, le=99)


class CheckoutRequest(BaseModel):
    items: list[CartItemRequest] = Field(min_length=1)


class CheckoutLineItem(BaseModel):
    product_id: int
    name: str
    quantity: int
    unit_price: Decimal
    line_total: Decimal


class CheckoutResponse(BaseModel):
    success: bool = True
    total: Decimal
    previous_balance: Decimal
    new_balance: Decimal
    items: list[CheckoutLineItem]
    invoice_id: int
    invoice_number: str
