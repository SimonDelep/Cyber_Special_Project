import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.order import Order
from app.models.user import User, UserRole
from app.schemas.checkout import CheckoutLineItem
from app.schemas.invoice import InvoiceDetail, InvoiceSummary
from app.services.invoice_pdf import generate_invoice_pdf

router = APIRouter(prefix="/invoices", tags=["invoices"])


def _get_order_for_user(db: Session, invoice_id: int, user: User) -> Order:
    order = db.query(Order).filter(Order.id == invoice_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if order.user_id != user.id and user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Access denied")
    return order


def _order_to_detail(order: Order) -> InvoiceDetail:
    items_data = json.loads(order.line_items_json)
    items = [CheckoutLineItem(**item) for item in items_data]
    return InvoiceDetail(
        id=order.id,
        invoice_number=order.invoice_number,
        total=order.total,
        previous_balance=order.previous_balance,
        new_balance=order.new_balance,
        items=items,
        created_at=order.created_at,
    )


@router.get("", response_model=list[InvoiceSummary])
def list_my_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Order)
        .filter(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )


@router.get("/{invoice_id}", response_model=InvoiceDetail)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = _get_order_for_user(db, invoice_id, current_user)
    return _order_to_detail(order)


@router.get("/{invoice_id}/pdf")
def download_invoice_pdf(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = _get_order_for_user(db, invoice_id, current_user)
    user = db.query(User).filter(User.id == order.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    pdf_bytes = generate_invoice_pdf(order, user)
    filename = f"{order.invoice_number}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
