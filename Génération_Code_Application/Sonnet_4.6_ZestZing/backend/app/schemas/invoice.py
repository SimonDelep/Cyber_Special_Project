from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.schemas.checkout import CheckoutLineItem


class InvoiceSummary(BaseModel):
    id: int
    invoice_number: str
    total: Decimal
    created_at: datetime

    model_config = {"from_attributes": True}


class InvoiceDetail(BaseModel):
    id: int
    invoice_number: str
    total: Decimal
    previous_balance: Decimal
    new_balance: Decimal
    items: list[CheckoutLineItem]
    created_at: datetime
