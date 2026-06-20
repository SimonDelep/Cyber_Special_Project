from datetime import datetime

from pydantic import BaseModel, ConfigDict


class OrderItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    product_name: str
    quantity: int
    price_cents: int


class OrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    total_cents: int
    status: str
    created_at: datetime
    items: list[OrderItemRead]


class CheckoutResponse(BaseModel):
    order: OrderRead
    balance_cents: int
