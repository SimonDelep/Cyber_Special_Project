import csv
import io
from decimal import Decimal, InvalidOperation

from fastapi import HTTPException, UploadFile, status
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.models.product import Product
from app.schemas.product import ProductCreate
from app.schemas.product_import import ProductImportResponse, ProductImportRowError
from app.services.products import create_product

REQUIRED_COLUMNS = {"name", "price"}
OPTIONAL_COLUMNS = {"description", "stock", "category", "image_url", "is_active"}
ALLOWED_COLUMNS = REQUIRED_COLUMNS | OPTIONAL_COLUMNS


def _parse_bool(value: str | None, default: bool = True) -> bool:
    if value is None or not str(value).strip():
        return default
    normalized = str(value).strip().lower()
    if normalized in {"true", "1", "yes", "y", "active"}:
        return True
    if normalized in {"false", "0", "no", "n", "inactive"}:
        return False
    raise ValueError(f"Invalid is_active value: {value}")


def _row_to_product_create(row: dict[str, str | None]) -> ProductCreate:
    name = (row.get("name") or "").strip()
    if not name:
        raise ValueError("name is required")

    price_raw = (row.get("price") or "").strip()
    if not price_raw:
        raise ValueError("price is required")
    try:
        price = Decimal(price_raw)
    except InvalidOperation as exc:
        raise ValueError(f"Invalid price: {price_raw}") from exc

    stock_raw = (row.get("stock") or "").strip()
    stock = int(stock_raw) if stock_raw else 0
    if stock < 0:
        raise ValueError("stock cannot be negative")

    description = (row.get("description") or "").strip() or None
    category = (row.get("category") or "").strip().lower() or "general"
    image_url = (row.get("image_url") or "").strip() or None
    is_active = _parse_bool(row.get("is_active"))

    return ProductCreate(
        name=name,
        description=description,
        price=price,
        stock=stock,
        category=category,
        image_url=image_url,
        is_active=is_active,
    )


async def import_products_from_csv(db: Session, file: UploadFile) -> tuple[ProductImportResponse, list[Product]]:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a .csv",
        )

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CSV file is empty")
    if len(raw) > 2 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV file must be 2 MB or smaller",
        )

    text = raw.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CSV header row is missing")

    headers = {h.strip().lower() for h in reader.fieldnames if h and h.strip()}
    missing = REQUIRED_COLUMNS - headers
    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing required columns: {', '.join(sorted(missing))}",
        )

    unknown = headers - ALLOWED_COLUMNS
    if unknown:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown columns: {', '.join(sorted(unknown))}",
        )

    created_products: list[Product] = []
    errors: list[ProductImportRowError] = []

    for row_number, raw_row in enumerate(reader, start=2):
        if not any((value or "").strip() for value in raw_row.values()):
            continue

        normalized = {
            (key or "").strip().lower(): (value.strip() if value else None)
            for key, value in raw_row.items()
            if key
        }

        try:
            payload = _row_to_product_create(normalized)
            product = create_product(db, payload)
            created_products.append(product)
        except (ValueError, ValidationError) as exc:
            if isinstance(exc, ValidationError):
                message = "; ".join(
                    f"{'.'.join(str(part) for part in err['loc'])}: {err['msg']}"
                    for err in exc.errors()
                )
            else:
                message = str(exc)
            errors.append(ProductImportRowError(row=row_number, message=message))

    if not created_products and not errors:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CSV contains no product rows")

    return (
        ProductImportResponse(
            created=len(created_products),
            failed=len(errors),
            errors=errors,
        ),
        created_products,
    )
