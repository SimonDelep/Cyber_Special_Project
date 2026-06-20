from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.checkout import CheckoutItemRequest, CheckoutLineItem, CheckoutRequest
from app.services.products import get_product


def process_checkout(db: Session, user: User, payload: CheckoutRequest) -> tuple[Decimal, list[CheckoutLineItem]]:
    if not payload.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty")

    line_items: list[CheckoutLineItem] = []
    total = Decimal("0.00")
    products_to_update = []

    seen_ids: set[int] = set()
    for item in payload.items:
        if item.product_id in seen_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Duplicate product entries in cart",
            )
        seen_ids.add(item.product_id)

        product = get_product(db, item.product_id)
        if not product or not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product #{item.product_id} is not available",
            )
        if product.stock < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Not enough stock for {product.name} (requested {item.quantity}, available {product.stock})",
            )

        unit_price = Decimal(product.price)
        line_total = unit_price * item.quantity
        total += line_total
        line_items.append(
            CheckoutLineItem(
                product_id=product.id,
                name=product.name,
                quantity=item.quantity,
                unit_price=unit_price,
                line_total=line_total,
            )
        )
        products_to_update.append((product, item.quantity))

    balance = Decimal(user.balance)
    if balance < total:
        shortfall = total - balance
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Insufficient balance. Your total is ${total:.2f} but you only have "
                f"${balance:.2f} (${shortfall:.2f} short)."
            ),
        )

    user.balance = balance - total
    for product, quantity in products_to_update:
        product.stock -= quantity
        db.add(product)

    db.add(user)
    db.commit()
    db.refresh(user)

    return total, line_items
