from decimal import Decimal
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.database import get_db
from app.models.event_log import EventLog, EventStatus, EventType
from app.models.product import Product
from app.models.user import User as UserModel
from app.models.user import UserRole
from app.schemas.event_log import EventLogPublic
from app.schemas.product import ProductAdmin, ProductCreate, ProductImportResult, ProductUpdate
from app.schemas.user import AdminBalanceAdjust, AdminUserSummary, AdminUserUpdate
from app.services.event_log import get_client_ip, log_event
from app.services.product_import import parse_and_import_products
from app.utils.slug import slugify, unique_product_slug

PRODUCTS_IMPORT_SAMPLE = (
    Path(__file__).resolve().parents[4] / "samples" / "products_import_sample.csv"
)
router = APIRouter(prefix="/admin", tags=["admin"])


def _get_user_or_404(db: Session, user_id: int) -> UserModel:
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def _get_product_or_404(db: Session, product_id: int) -> Product:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


# --- Users ---


@router.get("/users", response_model=list[AdminUserSummary])
def list_users(
    db: Session = Depends(get_db),
    _admin: UserModel = Depends(require_admin),
):
    return db.query(UserModel).order_by(UserModel.created_at.desc()).all()


@router.get("/users/{user_id}", response_model=AdminUserSummary)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _admin: UserModel = Depends(require_admin),
):
    return _get_user_or_404(db, user_id)


@router.put("/users/{user_id}", response_model=AdminUserSummary)
def update_user(
    user_id: int,
    body: AdminUserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    admin: UserModel = Depends(require_admin),
):
    user = _get_user_or_404(db, user_id)
    changes: list[str] = []

    if body.email and body.email != user.email:
        if db.query(UserModel).filter(UserModel.email == body.email, UserModel.id != user_id).first():
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = body.email
        changes.append("email")

    if body.first_name is not None:
        user.first_name = body.first_name or None
        changes.append("first_name")
    if body.last_name is not None:
        user.last_name = body.last_name or None
        changes.append("last_name")

    if body.role is not None:
        if user.id == admin.id and body.role != UserRole.ADMIN:
            raise HTTPException(status_code=400, detail="Cannot remove your own admin role")
        user.role = body.role
        changes.append("role")

    if body.balance is not None:
        user.balance = body.balance
        changes.append("balance")

    db.commit()
    db.refresh(user)

    if changes:
        log_event(
            db,
            EventType.ADMIN_USER_UPDATE,
            EventStatus.SUCCESS,
            f"Admin {admin.username} updated user {user.username}",
            user_id=admin.id,
            username=admin.username,
            ip_address=get_client_ip(request),
            details={"target_user_id": user_id, "target_username": user.username, "fields": changes},
        )
    return user


@router.patch("/users/{user_id}/balance", response_model=AdminUserSummary)
def adjust_user_balance(
    user_id: int,
    body: AdminBalanceAdjust,
    request: Request,
    db: Session = Depends(get_db),
    admin: UserModel = Depends(require_admin),
):
    user = _get_user_or_404(db, user_id)
    previous = user.balance
    new_balance = previous + body.adjustment
    if new_balance < 0:
        raise HTTPException(status_code=400, detail="Balance cannot be negative")
    user.balance = new_balance
    db.commit()
    db.refresh(user)
    log_event(
        db,
        EventType.ADMIN_BALANCE_ADJUST,
        EventStatus.SUCCESS,
        f"Admin {admin.username} adjusted {user.username} balance by {body.adjustment}",
        user_id=admin.id,
        username=admin.username,
        ip_address=get_client_ip(request),
        details={
            "target_user_id": user_id,
            "target_username": user.username,
            "adjustment": str(body.adjustment),
            "previous_balance": str(previous),
            "new_balance": str(new_balance),
        },
    )
    return user


# --- Products ---


@router.get("/products", response_model=list[ProductAdmin])
def list_products(
    db: Session = Depends(get_db),
    _admin: UserModel = Depends(require_admin),
):
    return db.query(Product).order_by(Product.name).all()


@router.get("/products/import/sample")
def download_products_import_sample(
    _admin: UserModel = Depends(require_admin),
):
    if not PRODUCTS_IMPORT_SAMPLE.is_file():
        raise HTTPException(status_code=404, detail="Sample CSV file not found")
    return FileResponse(
        PRODUCTS_IMPORT_SAMPLE,
        media_type="text/csv",
        filename="products_import_sample.csv",
    )


@router.post("/products/import", response_model=ProductImportResult)
async def import_products_csv(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: UserModel = Depends(require_admin),
):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Upload a .csv file")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="CSV file is empty")

    if len(content) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="CSV file must be 2 MB or smaller")

    result = parse_and_import_products(db, content)

    log_event(
        db,
        EventType.ADMIN_PRODUCT_IMPORT,
        EventStatus.SUCCESS if result.created else EventStatus.FAILURE,
        f"Admin {admin.username} imported products from CSV ({result.created} created, {result.failed} failed)",
        user_id=admin.id,
        username=admin.username,
        ip_address=get_client_ip(request),
        details={
            "filename": file.filename,
            "created": result.created,
            "failed": result.failed,
        },
    )

    return result


@router.get("/products/{product_id}", response_model=ProductAdmin)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    _admin: UserModel = Depends(require_admin),
):
    return _get_product_or_404(db, product_id)


@router.post("/products", response_model=ProductAdmin, status_code=status.HTTP_201_CREATED)
def create_product(
    body: ProductCreate,
    db: Session = Depends(get_db),
    _admin: UserModel = Depends(require_admin),
):
    base_slug = body.slug or slugify(body.name)
    slug = unique_product_slug(db, base_slug)

    product = Product(
        name=body.name,
        slug=slug,
        description=body.description,
        category=body.category,
        price=body.price,
        image_url=body.image_url,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/products/{product_id}", response_model=ProductAdmin)
def update_product(
    product_id: int,
    body: ProductUpdate,
    db: Session = Depends(get_db),
    _admin: UserModel = Depends(require_admin),
):
    product = _get_product_or_404(db, product_id)

    if body.name is not None:
        product.name = body.name
    if body.description is not None:
        product.description = body.description
    if body.category is not None:
        product.category = body.category
    if body.price is not None:
        product.price = body.price
    if body.image_url is not None:
        product.image_url = body.image_url or None

    if body.slug is not None:
        product.slug = unique_product_slug(db, body.slug, exclude_id=product_id)
    elif body.name is not None:
        product.slug = unique_product_slug(db, slugify(body.name), exclude_id=product_id)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _admin: UserModel = Depends(require_admin),
):
    product = _get_product_or_404(db, product_id)
    db.delete(product)
    db.commit()
    return None


# --- System logs ---


@router.get("/logs", response_model=list[EventLogPublic])
def list_event_logs(
    db: Session = Depends(get_db),
    _admin: UserModel = Depends(require_admin),
    event_type: EventType | None = None,
    status: EventStatus | None = None,
    username: str | None = Query(default=None, max_length=50),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    query = db.query(EventLog).order_by(EventLog.created_at.desc())

    if event_type is not None:
        query = query.filter(EventLog.event_type == event_type)
    if status is not None:
        query = query.filter(EventLog.status == status)
    if username:
        term = f"%{username.strip()}%"
        query = query.filter(EventLog.username.ilike(term))

    logs = query.offset(offset).limit(limit).all()
    return [EventLogPublic.from_model(log) for log in logs]
