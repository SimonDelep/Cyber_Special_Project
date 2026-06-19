from fastapi import APIRouter, HTTPException, status
from fastapi.responses import Response

from app.api.deps import CurrentUser, DbSession
from app.services.invoice import build_invoice_pdf
from app.services.order import get_order_for_user

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("/{order_id}/invoice")
def download_invoice(order_id: int, user: CurrentUser, db: DbSession) -> Response:
    order = get_order_for_user(db, order_id, user.id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if not order.items:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order has no line items")

    pdf_bytes = build_invoice_pdf(order, user)
    filename = f"pureroots-invoice-{order_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
