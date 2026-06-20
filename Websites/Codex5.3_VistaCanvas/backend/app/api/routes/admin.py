from decimal import Decimal
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.database import get_db
from app.models.product import Product
from app.models.system_event import EventStatus, EventType, SystemEvent
from app.models.user import User, UserRole
from app.schemas.product import ProductCreate, ProductPublic, ProductUpdate
from app.schemas.product_import import ProductImportResult
from app.services.product_csv import import_products_from_csv
from app.schemas.system_event import SystemEventPublic
from app.schemas.user import AdminUserUpdate, BalanceAdjustRequest, UserPublic
from app.services.event_log import event_to_public, log_event

router = APIRouter(prefix="/admin", tags=["admin"])


def _get_user_or_404(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def _get_product_or_404(db: Session, product_id: int) -> Product:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


# --- System log ---


@router.get("/events", response_model=list[SystemEventPublic])
def list_system_events(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_admin)],
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
    event_type: Annotated[EventType | None, Query()] = None,
    status: Annotated[EventStatus | None, Query()] = None,
    user_id: Annotated[int | None, Query()] = None,
) -> list[SystemEventPublic]:
    query = db.query(SystemEvent).order_by(SystemEvent.created_at.desc())
    if event_type is not None:
        query = query.filter(SystemEvent.event_type == event_type)
    if status is not None:
        query = query.filter(SystemEvent.status == status)
    if user_id is not None:
        query = query.filter(SystemEvent.user_id == user_id)
    events = query.limit(limit).all()
    return [SystemEventPublic(**event_to_public(e)) for e in events]


# --- Users ---


@router.get("/users", response_model=list[UserPublic])
def list_users(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_admin)],
) -> list[User]:
    return db.query(User).order_by(User.created_at.desc()).all()


@router.get("/users/{user_id}", response_model=UserPublic)
def get_user(
    user_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_admin)],
) -> User:
    return _get_user_or_404(db, user_id)


@router.put("/users/{user_id}", response_model=UserPublic)
def update_user(
    user_id: int,
    payload: AdminUserUpdate,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    admin: Annotated[User, Depends(require_admin)],
) -> User:
    user = _get_user_or_404(db, user_id)

    if payload.email is not None and payload.email != user.email:
        email = payload.email.strip()
        if "@" not in email or len(email) < 5:
            raise HTTPException(status_code=400, detail="Invalid email format")
        if db.query(User).filter(User.email == email, User.id != user_id).first():
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = email

    if payload.full_name is not None:
        user.full_name = payload.full_name or None
    if payload.bio is not None:
        user.bio = payload.bio or None
    if payload.role is not None:
        if user.id == admin.id and payload.role != UserRole.ADMIN:
            raise HTTPException(status_code=400, detail="Cannot demote your own admin account")
        user.role = payload.role
    if payload.is_active is not None:
        if user.id == admin.id and not payload.is_active:
            raise HTTPException(status_code=400, detail="Cannot deactivate your own account")
        user.is_active = payload.is_active
    if payload.balance is not None:
        user.balance = payload.balance

    db.commit()
    db.refresh(user)
    log_event(
        db,
        event_type=EventType.ADMIN_USER_UPDATE,
        status=EventStatus.SUCCESS,
        message=f"Admin updated user {user.username}",
        user_id=admin.id,
        username=admin.username,
        metadata={"target_user_id": user_id, "target_username": user.username},
        request=request,
    )
    return user


@router.patch("/users/{user_id}/balance", response_model=UserPublic)
def adjust_user_balance(
    user_id: int,
    payload: BalanceAdjustRequest,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    admin: Annotated[User, Depends(require_admin)],
) -> User:
    user = _get_user_or_404(db, user_id)

    if payload.balance is not None:
        user.balance = payload.balance
    elif payload.adjustment is not None:
        new_balance = Decimal(str(user.balance)) + payload.adjustment
        if new_balance < 0:
            raise HTTPException(
                status_code=400,
                detail="Balance cannot be negative",
            )
        user.balance = new_balance

    db.commit()
    db.refresh(user)
    log_event(
        db,
        event_type=EventType.ADMIN_BALANCE_ADJUST,
        status=EventStatus.SUCCESS,
        message=f"Admin adjusted balance for {user.username}",
        user_id=admin.id,
        username=admin.username,
        metadata={
            "target_user_id": user_id,
            "target_username": user.username,
            "new_balance": str(user.balance),
            "adjustment": str(payload.adjustment) if payload.adjustment is not None else None,
        },
        request=request,
    )
    return user


# --- Products ---

SAMPLE_CSV_PATH = (
    Path(__file__).resolve().parents[4] / "samples" / "products_import_sample.csv"
)


@router.get("/products/import-csv/sample")
def download_product_import_sample(
    _: Annotated[User, Depends(require_admin)],
) -> FileResponse:
    if not SAMPLE_CSV_PATH.is_file():
        raise HTTPException(status_code=404, detail="Sample CSV file not found")
    return FileResponse(
        path=SAMPLE_CSV_PATH,
        media_type="text/csv",
        filename="products_import_sample.csv",
    )


@router.post("/products/import-csv", response_model=ProductImportResult)
async def import_products_csv(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_admin)],
    file: UploadFile = File(...),
) -> ProductImportResult:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a .csv")

    raw = await file.read()
    if len(raw) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="CSV file exceeds 2 MB limit")

    try:
        content = raw.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise HTTPException(status_code=400, detail="CSV must be UTF-8 encoded") from exc

    created, errors, count = import_products_from_csv(db, content)
    return ProductImportResult(
        created_count=count,
        error_count=len(errors),
        errors=errors,
        products=created,
    )


@router.get("/products", response_model=list[ProductPublic])
def list_products(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_admin)],
) -> list[Product]:
    return db.query(Product).order_by(Product.created_at.desc()).all()


@router.get("/products/{product_id}", response_model=ProductPublic)
def get_product(
    product_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_admin)],
) -> Product:
    return _get_product_or_404(db, product_id)


@router.post("/products", response_model=ProductPublic, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_admin)],
) -> Product:
    if db.query(Product).filter(Product.slug == payload.slug).first():
        raise HTTPException(status_code=400, detail="Product slug already exists")

    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/products/{product_id}", response_model=ProductPublic)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_admin)],
) -> Product:
    product = _get_product_or_404(db, product_id)
    data = payload.model_dump(exclude_unset=True)

    if "slug" in data and data["slug"] != product.slug:
        if db.query(Product).filter(Product.slug == data["slug"]).first():
            raise HTTPException(status_code=400, detail="Product slug already exists")

    for key, value in data.items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_admin)],
) -> None:
    product = _get_product_or_404(db, product_id)
    db.delete(product)
    db.commit()
