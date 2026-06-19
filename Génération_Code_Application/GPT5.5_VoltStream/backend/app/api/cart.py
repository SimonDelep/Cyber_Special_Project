from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.cart_item import CartItem
from app.models.product import Product
from app.models.user import User
from app.schemas.cart import CartItemCreate, CartItemRead, CartItemUpdate, CartRead
from app.schemas.product import ProductRead
from app.services.cart import build_cart_response, get_or_create_cart_item, merge_guest_cart

router = APIRouter(prefix="/cart", tags=["cart"])


@router.get("", response_model=CartRead)
def get_cart(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return build_cart_response(db, user)


@router.post("/items", response_model=CartItemRead)
def add_to_cart(
    payload: CartItemCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == payload.product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    item = get_or_create_cart_item(db, user.id, product.id)
    item.quantity = min(item.quantity + payload.quantity, 99)
    db.commit()
    db.refresh(item)
    return CartItemRead(
        product_id=item.product_id,
        quantity=item.quantity,
        product=ProductRead.model_validate(product),
    )


@router.patch("/items/{product_id}", response_model=CartItemRead)
def update_cart_item(
    product_id: int,
    payload: CartItemUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(CartItem).filter(CartItem.user_id == user.id, CartItem.product_id == product_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not in cart")
    product = db.query(Product).filter(Product.id == product_id).first()
    item.quantity = payload.quantity
    db.commit()
    db.refresh(item)
    return CartItemRead(
        product_id=item.product_id,
        quantity=item.quantity,
        product=ProductRead.model_validate(product),
    )


@router.delete("/items/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_cart_item(
    product_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(CartItem).filter(CartItem.user_id == user.id, CartItem.product_id == product_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not in cart")
    db.delete(item)
    db.commit()


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def clear_cart(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(CartItem).filter(CartItem.user_id == user.id).delete()
    db.commit()


@router.post("/merge", response_model=CartRead)
def merge_cart(
    guest_items: list[CartItemCreate],
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payload = [{"product_id": i.product_id, "quantity": i.quantity} for i in guest_items]
    return merge_guest_cart(db, user, payload)
