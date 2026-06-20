from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_admin
from app.database import get_db
from app.models.product import Product
from app.models.system_log import SystemLog
from app.models.user import User
from app.schemas.admin import (
    AdminUserRead,
    AdminUserUpdate,
    ProductCreate,
    ProductImportResult,
    ProductUpdate,
)
from app.schemas.product import ProductRead
from app.schemas.system_log import SystemLogListResponse, SystemLogRead
from app.services.event_log import EVENT_PROFILE_UPDATE, client_ip, log_event
from app.services.product_import import parse_products_csv

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=list[AdminUserRead])
def list_users(_: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(User).order_by(User.id).all()


@router.get("/users/{user_id}", response_model=AdminUserRead)
def get_user(user_id: int, _: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.patch("/users/{user_id}", response_model=AdminUserRead)
def update_user(
    user_id: int,
    payload: AdminUserUpdate,
    request: Request,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    changes: dict[str, dict[str, object]] = {}
    if payload.email and payload.email != user.email:
        if db.query(User).filter(User.email == payload.email, User.id != user_id).first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already in use")
        changes["email"] = {"from": user.email, "to": payload.email}
        user.email = payload.email
    if payload.full_name is not None and payload.full_name != user.full_name:
        changes["full_name"] = {"from": user.full_name, "to": payload.full_name}
        user.full_name = payload.full_name
    if payload.is_admin is not None and payload.is_admin != user.is_admin:
        if user.id == admin.id and not payload.is_admin:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove your own admin privileges",
            )
        changes["is_admin"] = {"from": user.is_admin, "to": payload.is_admin}
        user.is_admin = payload.is_admin
    if payload.balance_cents is not None and payload.balance_cents != user.balance_cents:
        changes["balance_cents"] = {"from": user.balance_cents, "to": payload.balance_cents}
        user.balance_cents = payload.balance_cents

    db.commit()
    db.refresh(user)

    if changes:
        log_event(
            event_type=EVENT_PROFILE_UPDATE,
            message=f"Admin {admin.email} updated profile for user #{user_id} ({user.email})",
            actor_user_id=admin.id,
            actor_email=admin.email,
            target_user_id=user_id,
            ip_address=client_ip(request),
            details={"changes": changes},
        )

    return user


@router.get("/logs", response_model=SystemLogListResponse)
def list_system_logs(
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    event_type: str | None = Query(None),
    severity: str | None = Query(None),
):
    query = db.query(SystemLog)
    if event_type:
        query = query.filter(SystemLog.event_type == event_type)
    if severity:
        query = query.filter(SystemLog.severity == severity)
    total = query.count()
    items = query.order_by(SystemLog.created_at.desc()).offset(offset).limit(limit).all()
    return SystemLogListResponse(
        items=[SystemLogRead.model_validate(i) for i in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/products", response_model=list[ProductRead])
def list_products_admin(_: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(Product).order_by(Product.category, Product.name).all()


@router.post("/products", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.post("/products/import", response_model=ProductImportResult)
async def import_products_csv(
    file: UploadFile = File(...),
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Upload a .csv file")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CSV file is empty")
    if len(content) > 2 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CSV file must be 2 MB or smaller")

    products, parse_errors = parse_products_csv(content)
    created_names: list[str] = []
    row_errors = list(parse_errors)

    for product in products:
        if db.query(Product).filter(Product.name == product.name).first():
            row_errors.append(f'Product "{product.name}" already exists — skipped')
            continue
        db.add(Product(**product.model_dump()))
        created_names.append(product.name)

    if created_names:
        db.commit()

    created = len(created_names)
    failed = len(row_errors)
    return ProductImportResult(
        created=created,
        failed=failed,
        errors=row_errors[:50],
        created_names=created_names,
    )


@router.patch("/products/{product_id}", response_model=ProductRead)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    db.delete(product)
    db.commit()
