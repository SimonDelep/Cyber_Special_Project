from decimal import Decimal

from pydantic import BaseModel, Field


class CheckoutLineItem(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(ge=1, le=99)


class CheckoutRequest(BaseModel):
    items: list[CheckoutLineItem] = Field(min_length=1)


class CheckoutLineResult(BaseModel):
    product_id: int
    name: str
    quantity: int
    unit_price: Decimal
    line_total: Decimal


class CheckoutResponse(BaseModel):
    message: str
    order_id: int
    invoice_number: str
    total_charged: Decimal
    balance: Decimal
    items: list[CheckoutLineResult]
