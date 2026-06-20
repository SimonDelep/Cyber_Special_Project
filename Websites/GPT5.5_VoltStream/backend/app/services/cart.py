from sqlalchemy.orm import Session, joinedload

from app.models.cart_item import CartItem
from app.models.product import Product
from app.models.user import User
from app.schemas.cart import CartItemRead, CartRead
from app.schemas.product import ProductRead


def build_cart_response(db: Session, user: User) -> CartRead:
    items = (
        db.query(CartItem)
        .options(joinedload(CartItem.product))
        .filter(CartItem.user_id == user.id)
        .all()
    )
    cart_items = [
        CartItemRead(
            product_id=item.product_id,
            quantity=item.quantity,
            product=ProductRead.model_validate(item.product),
        )
        for item in items
    ]
    total = sum(i.product.price_cents * i.quantity for i in items)
    count = sum(i.quantity for i in items)
    return CartRead(items=cart_items, total_cents=total, item_count=count)


def get_or_create_cart_item(db: Session, user_id: int, product_id: int) -> CartItem:
    item = db.query(CartItem).filter(CartItem.user_id == user_id, CartItem.product_id == product_id).first()
    if item:
        return item
    item = CartItem(user_id=user_id, product_id=product_id, quantity=0)
    db.add(item)
    db.flush()
    return item


def merge_guest_cart(db: Session, user: User, guest_items: list[dict]) -> CartRead:
    for entry in guest_items:
        product = db.query(Product).filter(Product.id == entry["product_id"]).first()
        if not product:
            continue
        qty = min(max(int(entry.get("quantity", 1)), 1), 99)
        item = get_or_create_cart_item(db, user.id, product.id)
        item.quantity = min(item.quantity + qty, 99)
    db.commit()
    return build_cart_response(db, user)
