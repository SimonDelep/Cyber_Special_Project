from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.order import Order


def get_order_for_user(db: Session, order_id: int, user_id: int) -> Order | None:
    stmt = (
        select(Order)
        .options(joinedload(Order.items))
        .where(Order.id == order_id, Order.user_id == user_id)
    )
    return db.scalar(stmt)
