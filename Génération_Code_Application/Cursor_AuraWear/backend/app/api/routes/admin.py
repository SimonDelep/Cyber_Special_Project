from decimal import Decimal

from fastapi import APIRouter, File, HTTPException, Query, Request, UploadFile, status
from sqlalchemy import select

from app.api.deps import AdminUser, DbSession
from app.models.system_event import EventCategory
from app.models.user import User, UserRole
from app.schemas.admin import AdminUserPublic, AdminUserUpdate, BalanceUpdate
from app.schemas.product import ProductCreate, ProductPublic, ProductUpdate
from app.schemas.product_import import ProductImportResponse
from app.schemas.system_event import SystemEventListResponse, SystemEventPublic
from app.services.auth import get_user_by_email, get_user_by_id
from app.services.events import list_events, log_event
from app.services.products import (
    create_product,
    delete_product,
    list_products,
    require_product,
    update_product,
)
from app.services.product_import import import_products_from_csv

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/events", response_model=SystemEventListResponse)
def admin_list_events(
    _admin: AdminUser,
    db: DbSession,
    category: EventCategory | None = None,
    event_type: str | None = Query(default=None, max_length=80),
    success: bool | None = None,
    user_id: int | None = Query(default=None, ge=1),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> SystemEventListResponse:
    events, total = list_events(
        db,
        category=category,
        event_type=event_type,
        success=success,
        user_id=user_id,
        limit=limit,
        offset=offset,
    )
    return SystemEventListResponse(
        items=[SystemEventPublic.model_validate(e) for e in events],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/users", response_model=list[AdminUserPublic])
def list_users(_admin: AdminUser, db: DbSession) -> list[AdminUserPublic]:
    users = db.scalars(select(User).order_by(User.id)).all()
    return [AdminUserPublic.model_validate(u) for u in users]


@router.get("/users/{user_id}", response_model=AdminUserPublic)
def get_user(user_id: int, _admin: AdminUser, db: DbSession) -> AdminUserPublic:
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return AdminUserPublic.model_validate(user)


@router.patch("/users/{user_id}", response_model=AdminUserPublic)
def update_user(
    user_id: int,
    payload: AdminUserUpdate,
    admin: AdminUser,
    db: DbSession,
    request: Request,
) -> AdminUserPublic:
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.id == admin.id and payload.role is not None and payload.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot remove your own admin role",
        )

    if payload.email is not None:
        email = payload.email.lower()
        existing = get_user_by_email(db, email)
        if existing and existing.id != user.id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already in use")
        user.email = email
    if payload.role is not None:
        user.role = payload.role
    if payload.first_name is not None:
        user.first_name = payload.first_name or None
    if payload.last_name is not None:
        user.last_name = payload.last_name or None
    if payload.phone is not None:
        user.phone = payload.phone or None

    db.add(user)
    db.commit()
    db.refresh(user)
    log_event(
        db,
        event_type="admin.user.update",
        category=EventCategory.admin,
        message=f"Admin {admin.username} updated user {user.username}",
        request=request,
        user_id=admin.id,
        actor_username=admin.username,
        details={"target_user_id": user.id, "target_username": user.username},
    )
    return AdminUserPublic.model_validate(user)


@router.patch("/users/{user_id}/balance", response_model=AdminUserPublic)
def adjust_user_balance(
    user_id: int,
    payload: BalanceUpdate,
    admin: AdminUser,
    db: DbSession,
    request: Request,
) -> AdminUserPublic:
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if payload.set_balance is not None:
        previous = str(user.balance)
        user.balance = payload.set_balance
        adjustment_detail = {"set_balance": str(payload.set_balance), "previous_balance": previous}
    elif payload.adjustment is not None:
        previous = Decimal(user.balance)
        new_balance = previous + payload.adjustment
        if new_balance < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Balance cannot be negative",
            )
        user.balance = new_balance
        adjustment_detail = {
            "adjustment": str(payload.adjustment),
            "previous_balance": str(previous),
            "new_balance": str(new_balance),
        }
    else:
        adjustment_detail = {}

    db.add(user)
    db.commit()
    db.refresh(user)
    log_event(
        db,
        event_type="admin.balance.adjust",
        category=EventCategory.admin,
        message=f"Admin {admin.username} adjusted balance for {user.username}",
        request=request,
        user_id=admin.id,
        actor_username=admin.username,
        details={"target_user_id": user.id, "target_username": user.username, **adjustment_detail},
    )
    return AdminUserPublic.model_validate(user)


@router.get("/products", response_model=list[ProductPublic])
def admin_list_products(_admin: AdminUser, db: DbSession) -> list[ProductPublic]:
    products = list_products(db, include_inactive=True)
    return [ProductPublic.model_validate(p) for p in products]


@router.post("/products", response_model=ProductPublic, status_code=status.HTTP_201_CREATED)
def admin_create_product(payload: ProductCreate, _admin: AdminUser, db: DbSession) -> ProductPublic:
    product = create_product(db, payload)
    return ProductPublic.model_validate(product)


@router.post("/products/import", response_model=ProductImportResponse)
async def admin_import_products(
    request: Request,
    admin: AdminUser,
    db: DbSession,
    file: UploadFile = File(...),
) -> ProductImportResponse:
    result, _created = await import_products_from_csv(db, file)
    if result.created:
        log_event(
            db,
            event_type="admin.products.import",
            category=EventCategory.admin,
            message=f"Admin {admin.username} imported {result.created} product(s) from CSV",
            request=request,
            user_id=admin.id,
            actor_username=admin.username,
            details={
                "created": result.created,
                "failed": result.failed,
                "filename": file.filename,
            },
        )
    return result


@router.get("/products/{product_id}", response_model=ProductPublic)
def admin_get_product(product_id: int, _admin: AdminUser, db: DbSession) -> ProductPublic:
    product = require_product(db, product_id)
    return ProductPublic.model_validate(product)


@router.patch("/products/{product_id}", response_model=ProductPublic)
def admin_update_product(
    product_id: int,
    payload: ProductUpdate,
    _admin: AdminUser,
    db: DbSession,
) -> ProductPublic:
    product = require_product(db, product_id)
    product = update_product(db, product, payload)
    return ProductPublic.model_validate(product)


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_product(product_id: int, _admin: AdminUser, db: DbSession) -> None:
    product = require_product(db, product_id)
    delete_product(db, product)
