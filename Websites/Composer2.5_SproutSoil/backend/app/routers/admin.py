from decimal import Decimal

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.core.event_logger import CATEGORY_ADMIN, log_event
from app.database import get_db
from app.models import Product
from app.models.user import User, UserRole
from app.schemas.admin import AdminUserUpdate, BalanceAdjust
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate
from app.schemas.product_import import ProductImportResult
from app.services.product_csv_import import MAX_CSV_BYTES, import_products_from_csv
from app.schemas.user import UserRead

router = APIRouter(prefix="/admin", tags=["admin"])


# --- Users ---


@router.get("/users", response_model=list[UserRead])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [UserRead.model_validate(u) for u in users]


@router.get("/users/{user_id}", response_model=UserRead)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserRead.model_validate(user)


@router.put("/users/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    payload: AdminUserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if payload.username and payload.username != user.username:
        if db.query(User).filter(User.username == payload.username).first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken")
        user.username = payload.username

    if payload.email is not None and payload.email != user.email:
        if payload.email and db.query(User).filter(User.email == payload.email).first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        user.email = payload.email

    if payload.full_name is not None:
        user.full_name = payload.full_name

    if payload.profile_picture_url is not None:
        user.profile_picture_url = payload.profile_picture_url or None

    if payload.role is not None:
        if user.id == admin.id and payload.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot remove your own admin role",
            )
        user.role = payload.role

    db.commit()
    db.refresh(user)
    log_event(
        db,
        category=CATEGORY_ADMIN,
        action="user_update",
        user=admin,
        success=True,
        message=f"Admin '{admin.username}' updated user '{user.username}'",
        details={"target_user_id": user.id, "changes": payload.model_dump(exclude_unset=True)},
    )
    return UserRead.model_validate(user)


@router.patch("/users/{user_id}/balance", response_model=UserRead)
def adjust_balance(
    user_id: int,
    payload: BalanceAdjust,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    current = Decimal(str(user.balance or 0))

    if payload.mode == "set":
        if payload.amount < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Balance cannot be negative",
            )
        user.balance = payload.amount
    else:
        new_balance = current + payload.amount
        if new_balance < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Balance cannot go below zero",
            )
        user.balance = new_balance

    db.commit()
    db.refresh(user)
    log_event(
        db,
        category=CATEGORY_ADMIN,
        action="balance_adjust",
        user=admin,
        success=True,
        message=f"Admin '{admin.username}' adjusted balance for '{user.username}'",
        details={
            "target_user_id": user.id,
            "mode": payload.mode,
            "amount": str(payload.amount),
            "new_balance": str(user.balance),
        },
    )
    return UserRead.model_validate(user)


# --- Products ---


@router.get("/products", response_model=list[ProductRead])
def list_products_admin(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    products = db.query(Product).order_by(Product.name).all()
    return [ProductRead.model_validate(p) for p in products]


@router.post("/products/import-csv", response_model=ProductImportResult)
async def import_products_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    filename = (file.filename or "").lower()
    if not filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a .csv file",
        )

    raw = await file.read()
    if not raw:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV file is empty",
        )
    if len(raw) > MAX_CSV_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV file must be smaller than 2 MB",
        )

    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV file must be UTF-8 encoded",
        )

    products, errors = import_products_from_csv(text, db)
    created_reads: list[ProductRead] = []

    if products:
        db.add_all(products)
        db.commit()
        for product in products:
            db.refresh(product)
            created_reads.append(ProductRead.model_validate(product))

        log_event(
            db,
            category=CATEGORY_ADMIN,
            action="product_import_csv",
            user=admin,
            success=True,
            message=f"Admin '{admin.username}' imported {len(products)} product(s) from CSV",
            details={
                "filename": file.filename,
                "created": len(products),
                "failed": len(errors),
                "slugs": [p.slug for p in products],
            },
        )

    return ProductImportResult(
        created=len(created_reads),
        failed=len(errors),
        errors=errors,
        products=created_reads,
    )


@router.post("/products", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if db.query(Product).filter(Product.slug == payload.slug).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Slug already exists")

    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    log_event(
        db,
        category=CATEGORY_ADMIN,
        action="product_create",
        user=admin,
        success=True,
        message=f"Admin '{admin.username}' created product '{product.name}'",
        details={"product_id": product.id, "slug": product.slug},
    )
    return ProductRead.model_validate(product)


@router.put("/products/{product_id}", response_model=ProductRead)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    data = payload.model_dump(exclude_unset=True)

    if "slug" in data and data["slug"] != product.slug:
        if db.query(Product).filter(Product.slug == data["slug"]).first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Slug already exists")

    for key, value in data.items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)
    log_event(
        db,
        category=CATEGORY_ADMIN,
        action="product_update",
        user=admin,
        success=True,
        message=f"Admin '{admin.username}' updated product '{product.name}'",
        details={"product_id": product.id, "changes": data},
    )
    return ProductRead.model_validate(product)


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    name, slug = product.name, product.slug
    db.delete(product)
    db.commit()
    log_event(
        db,
        category=CATEGORY_ADMIN,
        action="product_delete",
        user=admin,
        success=True,
        message=f"Admin '{admin.username}' deleted product '{name}'",
        details={"product_id": product_id, "slug": slug},
    )
    return None
