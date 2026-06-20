from typing import Optional

from fastapi import APIRouter, File, HTTPException, Query, Request, UploadFile, status

from app.api.deps import AdminUser, DbSession
from app.core.request_utils import get_client_ip
from app.models.system_log import EventType
from app.models.user import UserRole
from app.schemas.admin import (
    AdminUserUpdate,
    BalanceAdjustRequest,
    ProductCreate,
    ProductImportResult,
    ProductImportRowError,
    ProductUpdate,
    RoleUpdateRequest,
    UserAdminRead,
)
from app.schemas.product import ProductRead
from app.schemas.system_log import SystemLogListResponse, SystemLogRead
from app.services.admin_user import AdminUserError, admin_update_user, adjust_user_balance
from app.services.auth import DuplicateUserError, get_user_by_id
from app.services.product_admin import (
    ProductError,
    create_product,
    delete_product,
    get_product,
    list_all_products,
    update_product,
)
from app.services.product_import import CsvImportError, import_products_from_csv
from app.services.system_log import list_logs, log_event
from app.services.user import admin_update_user_role, list_all_users

router = APIRouter(prefix="/admin", tags=["admin"])


# --- Users ---


@router.get("/users", response_model=list[UserAdminRead])
def list_users(_: AdminUser, db: DbSession) -> list[UserAdminRead]:
    users = list_all_users(db)
    return [UserAdminRead.model_validate(u) for u in users]


@router.get("/users/{user_id}", response_model=UserAdminRead)
def get_user(user_id: int, _: AdminUser, db: DbSession) -> UserAdminRead:
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserAdminRead.model_validate(user)


@router.patch("/users/{user_id}", response_model=UserAdminRead)
def update_user(
    user_id: int,
    body: AdminUserUpdate,
    request: Request,
    admin: AdminUser,
    db: DbSession,
) -> UserAdminRead:
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if admin.id == user_id and body.is_active is False:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot deactivate yourself")
    if admin.id == user_id and body.role == UserRole.USER:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot remove your own admin role")

    try:
        updated = admin_update_user(db, user, body)
    except DuplicateUserError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e)) from e
    log_event(
        db,
        EventType.ADMIN_USER_UPDATE.value,
        message=f"Admin {admin.username} updated user {updated.username}",
        user=admin,
        ip_address=get_client_ip(request),
        details={
            "target_user_id": user_id,
            "target_username": updated.username,
            "role": updated.role.value,
            "is_active": updated.is_active,
        },
    )
    return UserAdminRead.model_validate(updated)


@router.patch("/users/{user_id}/role", response_model=UserAdminRead)
def change_user_role(
    user_id: int,
    body: RoleUpdateRequest,
    admin: AdminUser,
    db: DbSession,
) -> UserAdminRead:
    if admin.id == user_id and body.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot remove your own admin role",
        )
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    updated = admin_update_user_role(db, user, body.role)
    return UserAdminRead.model_validate(updated)


@router.patch("/users/{user_id}/balance", response_model=UserAdminRead)
def update_user_balance(
    user_id: int,
    body: BalanceAdjustRequest,
    request: Request,
    admin: AdminUser,
    db: DbSession,
) -> UserAdminRead:
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    try:
        updated = adjust_user_balance(db, user, body)
    except AdminUserError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    log_event(
        db,
        EventType.BALANCE_ADJUSTMENT.value,
        message=f"Admin {admin.username} adjusted balance for {updated.username}",
        user=admin,
        ip_address=get_client_ip(request),
        details={
            "target_user_id": user_id,
            "target_username": updated.username,
            "new_balance": str(updated.balance),
            "adjustment": str(body.adjustment) if body.adjustment is not None else None,
            "set_balance": str(body.balance) if body.balance is not None else None,
            "note": body.note,
        },
    )
    return UserAdminRead.model_validate(updated)


# --- Products ---


@router.get("/products", response_model=list[ProductRead])
def list_products_admin(_: AdminUser, db: DbSession) -> list[ProductRead]:
    products = list_all_products(db)
    return [ProductRead.model_validate(p) for p in products]


@router.post("/products/csv-import", response_model=ProductImportResult)
async def import_products_csv(
    _: AdminUser,
    db: DbSession,
    file: UploadFile = File(..., description="UTF-8 CSV with product rows"),
) -> ProductImportResult:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Upload a .csv file",
        )
    content = await file.read()
    if len(content) > 1_000_000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV file must be 1 MB or smaller",
        )
    if not content.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CSV file is empty")

    try:
        created, errors = import_products_from_csv(db, content)
    except CsvImportError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e

    return ProductImportResult(
        created=len(created),
        failed=len(errors),
        errors=[ProductImportRowError(**err) for err in errors],
    )


@router.post("/products", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product_admin(body: ProductCreate, _: AdminUser, db: DbSession) -> ProductRead:
    try:
        product = create_product(db, body)
    except ProductError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e)) from e
    return ProductRead.model_validate(product)


@router.patch("/products/{product_id}", response_model=ProductRead)
def update_product_admin(
    product_id: int,
    body: ProductUpdate,
    _: AdminUser,
    db: DbSession,
) -> ProductRead:
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    try:
        updated = update_product(db, product, body)
    except ProductError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e)) from e
    return ProductRead.model_validate(updated)


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product_admin(product_id: int, _: AdminUser, db: DbSession) -> None:
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    try:
        delete_product(db, product)
    except ProductError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e)) from e


# --- System logs ---


@router.get("/logs", response_model=SystemLogListResponse)
def get_system_logs(
    _: AdminUser,
    db: DbSession,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    event_type: Optional[str] = Query(default=None),
    username: Optional[str] = Query(default=None),
    success: Optional[bool] = Query(default=None),
) -> SystemLogListResponse:
    logs, total = list_logs(
        db,
        limit=limit,
        offset=offset,
        event_type=event_type,
        username=username,
        success=success,
    )
    return SystemLogListResponse(
        items=[SystemLogRead.model_validate(log) for log in logs],
        total=total,
        limit=limit,
        offset=offset,
    )
