from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.user import User
from app.schemas.checkout import CheckoutItemRequest, CheckoutLineItem, CheckoutResponse


class CheckoutError(Exception):
    pass


class InsufficientBalanceError(CheckoutError):
    def __init__(self, balance: Decimal, total: Decimal):
        self.balance = balance
        self.total = total
        super().__init__(
            f"Insufficient account balance. You have ${balance:.2f} but the order total is ${total:.2f}."
        )


def process_checkout(
    db: Session,
    user: User,
    items: list[CheckoutItemRequest],
) -> CheckoutResponse:
    if not items:
        raise CheckoutError("Cart is empty")

    line_items: list[CheckoutLineItem] = []
    total = Decimal("0.00")

    for item in items:
        product = db.get(Product, item.product_id)
        if not product:
            raise CheckoutError(f"Product #{item.product_id} not found")

        unit_price = Decimal(product.price)
        line_total = unit_price * item.quantity
        total += line_total
        line_items.append(
            CheckoutLineItem(
                product_id=product.id,
                product_name=product.name,
                quantity=item.quantity,
                unit_price=unit_price,
                line_total=line_total,
            )
        )

    balance = Decimal(user.balance if user.balance is not None else 0)
    if balance < total:
        raise InsufficientBalanceError(balance=balance, total=total)

    user.balance = balance - total

    order = Order(user_id=user.id, total=total)
    db.add(order)
    db.flush()

    for line in line_items:
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=line.product_id,
                product_name=line.product_name,
                quantity=line.quantity,
                unit_price=line.unit_price,
                line_total=line.line_total,
            )
        )

    db.commit()
    db.refresh(user)

    return CheckoutResponse(
        order_id=order.id,
        total=total,
        new_balance=Decimal(user.balance),
        items=line_items,
        message="Order placed successfully. Thank you for shopping sustainably!",
    )
