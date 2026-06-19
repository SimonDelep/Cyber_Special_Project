from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import Response
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_current_user
from app.database import get_db
from app.models.order import Order
from app.models.user import User
from app.schemas.order import CheckoutResponse, OrderItemRead, OrderRead
from app.services.checkout import process_checkout
from app.services.event_log import (
    EVENT_CHECKOUT_FAILURE,
    EVENT_CHECKOUT_SUCCESS,
    client_ip,
    log_event,
)
from app.services.invoice_pdf import build_invoice_pdf



router = APIRouter(tags=["checkout"])





@router.post("/checkout", response_model=CheckoutResponse)

def checkout(

    request: Request,

    user: User = Depends(get_current_user),

    db: Session = Depends(get_db),

):

    ip = client_ip(request)

    try:

        result = process_checkout(db, user)

        log_event(

            event_type=EVENT_CHECKOUT_SUCCESS,

            message=f"Checkout completed: order #{result.order.id} (${result.order.total_cents / 100:.2f})",

            actor_user_id=user.id,

            actor_email=user.email,

            ip_address=ip,

            details={

                "order_id": result.order.id,

                "total_cents": result.order.total_cents,

                "balance_cents_after": result.balance_cents,

                "item_count": len(result.order.items),

            },

        )

        return result

    except HTTPException as exc:

        log_event(

            event_type=EVENT_CHECKOUT_FAILURE,

            message=f"Checkout failed for {user.email}: {exc.detail}",

            success=False,

            severity="warning",

            actor_user_id=user.id,

            actor_email=user.email,

            ip_address=ip,

            details={"reason": str(exc.detail), "status_code": exc.status_code},

        )

        raise





@router.get("/orders", response_model=list[OrderRead])

def list_orders(user: User = Depends(get_current_user), db: Session = Depends(get_db)):

    orders = (

        db.query(Order)

        .options(joinedload(Order.items))

        .filter(Order.user_id == user.id)

        .order_by(Order.created_at.desc())

        .all()

    )

    return [

        OrderRead(

            id=o.id,

            total_cents=o.total_cents,

            status=o.status,

            created_at=o.created_at,

            items=[OrderItemRead.model_validate(i) for i in o.items],

        )

        for o in orders

    ]





@router.get("/orders/{order_id}/invoice")
def download_order_invoice(
    order_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.id == order_id, Order.user_id == user.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    pdf_bytes = build_invoice_pdf(order, user)
    filename = f"gamergrid-invoice-{order.id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/orders/{order_id}", response_model=OrderRead)
def get_order(order_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.id == order_id, Order.user_id == user.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return OrderRead(
        id=order.id,
        total_cents=order.total_cents,
        status=order.status,
        created_at=order.created_at,
        items=[OrderItemRead.model_validate(i) for i in order.items],
    )

