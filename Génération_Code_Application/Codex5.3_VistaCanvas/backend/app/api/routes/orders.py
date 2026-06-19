from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_current_user
from app.database import get_db
from app.models.order import Order
from app.models.user import User
from app.schemas.order import OrderPublic
from app.services.invoice_pdf import build_invoice_pdf

router = APIRouter(prefix="/orders", tags=["orders"])


def _get_user_order(db: Session, order_id: int, user_id: int) -> Order:
    order = (
        db.query(Order)
        .options(joinedload(Order.lines))
        .filter(Order.id == order_id, Order.user_id == user_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.get("/me", response_model=list[OrderPublic])
def list_my_orders(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> list[Order]:
    return (
        db.query(Order)
        .options(joinedload(Order.lines))
        .filter(Order.user_id == user.id)
        .order_by(Order.created_at.desc())
        .limit(50)
        .all()
    )


@router.get("/{order_id}", response_model=OrderPublic)
def get_order(
    order_id: int,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> Order:
    return _get_user_order(db, order_id, user.id)


@router.get("/{order_id}/invoice")
def download_invoice_pdf(
    order_id: int,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> Response:
    order = _get_user_order(db, order_id, user.id)
    pdf_bytes = build_invoice_pdf(order, order.lines, user)
    filename = f"invoice-{order.invoice_number}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
