from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict


class InvoiceItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product_id: int
    product_name: str
    quantity: int
    unit_price: Decimal
    line_total: Decimal


class InvoiceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    invoice_number: str
    total: Decimal
    balance_after: Decimal
    created_at: datetime
    items: list[InvoiceItemRead]


class InvoiceSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    invoice_number: str
    total: Decimal
    created_at: datetime
