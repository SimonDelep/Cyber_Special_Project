from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.cart_item import CartItem
from app.models.order import Order, OrderItem
from app.models.user import User
from app.schemas.order import CheckoutResponse, OrderItemRead, OrderRead


def process_checkout(db: Session, user: User) -> CheckoutResponse:
    cart_items = (
        db.query(CartItem)
        .options(joinedload(CartItem.product))
        .filter(CartItem.user_id == user.id)
        .all()
    )
    if not cart_items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty")

    total_cents = sum(item.product.price_cents * item.quantity for item in cart_items)

    db.refresh(user)
    if user.balance_cents < total_cents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Insufficient balance. You have ${user.balance_cents / 100:.2f} "
                f"but the order total is ${total_cents / 100:.2f}."
            ),
        )

    order = Order(user_id=user.id, total_cents=total_cents, status="completed")
    db.add(order)
    db.flush()

    for item in cart_items:
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=item.product_id,
                product_name=item.product.name,
                quantity=item.quantity,
                price_cents=item.product.price_cents,
            )
        )

    user.balance_cents -= total_cents
    db.query(CartItem).filter(CartItem.user_id == user.id).delete()
    db.commit()
    db.refresh(order)
    order = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.id == order.id)
        .first()
    )
    return CheckoutResponse(
        order=OrderRead(
            id=order.id,
            total_cents=order.total_cents,
            status=order.status,
            created_at=order.created_at,
            items=[OrderItemRead.model_validate(i) for i in order.items],
        ),
        balance_cents=user.balance_cents,
    )
