from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_current_user
from app.models.user import UserRole
from app.database import get_db
from app.models.order import Order
from app.models.user import User
from app.schemas.invoice import InvoiceRead, InvoiceSummary
from app.services.invoice_pdf import generate_invoice_pdf

router = APIRouter(prefix="/invoices", tags=["invoices"])


def _get_order_for_user(db: Session, invoice_number: str, user: User) -> Order:
    order = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.invoice_number == invoice_number)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    if order.user_id != user.id and user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return order


@router.get("", response_model=list[InvoiceSummary])
def list_my_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    orders = (
        db.query(Order)
        .filter(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return [InvoiceSummary.model_validate(o) for o in orders]


@router.get("/{invoice_number}", response_model=InvoiceRead)
def get_invoice(
    invoice_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.invoice_number == invoice_number)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    if order.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return InvoiceRead.model_validate(order)


@router.get("/{invoice_number}/pdf")
def download_invoice_pdf(
    invoice_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = _get_order_for_user(db, invoice_number, current_user)
    owner = db.query(User).filter(User.id == order.user_id).first()
    if not owner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    pdf_bytes = generate_invoice_pdf(order, order.items, owner)
    filename = f"sproutsoil-invoice-{invoice_number}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
