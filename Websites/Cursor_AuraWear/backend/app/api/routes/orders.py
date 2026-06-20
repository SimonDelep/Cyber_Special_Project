from fastapi import APIRouter
from fastapi.responses import Response

from app.api.deps import CurrentUser, DbSession
from app.services.invoice import generate_invoice_pdf
from app.services.orders import require_order_for_user

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("/{order_id}/invoice")
def download_invoice(order_id: int, user: CurrentUser, db: DbSession) -> Response:
    order = require_order_for_user(db, order_id, user.id)
    pdf_bytes = generate_invoice_pdf(order, user)
    filename = f"{order.invoice_number}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
