import csv
import io
import re
from decimal import Decimal, InvalidOperation

from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.models import Product
from app.schemas.product import ProductCreate
from app.schemas.product_import import ProductImportRowError

REQUIRED_COLUMNS = {"name", "description", "price", "category"}
OPTIONAL_COLUMNS = {"slug", "image_url"}
ALLOWED_COLUMNS = REQUIRED_COLUMNS | OPTIONAL_COLUMNS

MAX_CSV_BYTES = 2 * 1024 * 1024
MAX_ROWS = 500


def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "product"


def _unique_slug(base: str, used: set[str], existing: set[str]) -> str:
    candidate = base
    suffix = 2
    while candidate in used or candidate in existing:
        candidate = f"{base}-{suffix}"
        suffix += 1
    return candidate


def _normalize_row(row: dict[str, str | None]) -> dict[str, str]:
    return {
        key: (value or "").strip()
        for key, value in row.items()
        if key in ALLOWED_COLUMNS
    }


def import_products_from_csv(
    content: str, db: Session
) -> tuple[list[Product], list[ProductImportRowError]]:
    content = content.lstrip("\ufeff")
    reader = csv.DictReader(io.StringIO(content))

    if not reader.fieldnames:
        return [], [ProductImportRowError(row=0, message="CSV file is empty or missing a header row")]

    headers = {h.strip().lower() for h in reader.fieldnames if h}
    missing = REQUIRED_COLUMNS - headers
    if missing:
        return [], [
            ProductImportRowError(
                row=0,
                message=f"Missing required columns: {', '.join(sorted(missing))}",
            )
        ]

    unknown = headers - ALLOWED_COLUMNS
    if unknown:
        return [], [
            ProductImportRowError(
                row=0,
                message=f"Unknown columns: {', '.join(sorted(unknown))}",
            )
        ]

    existing_slugs = {row[0] for row in db.query(Product.slug).all()}
    used_slugs: set[str] = set()
    products: list[Product] = []
    errors: list[ProductImportRowError] = []
    row_count = 0

    for row_num, raw_row in enumerate(reader, start=2):
        if row_count >= MAX_ROWS:
            errors.append(
                ProductImportRowError(
                    row=row_num,
                    message=f"Import limited to {MAX_ROWS} products per file",
                )
            )
            break

        normalized = _normalize_row(
            {k.strip().lower(): v for k, v in raw_row.items() if k}
        )

        if not any(normalized.values()):
            continue

        row_count += 1
        name = normalized.get("name", "")
        description = normalized.get("description", "")
        category = normalized.get("category", "")
        price_raw = normalized.get("price", "")
        slug_raw = normalized.get("slug", "")
        image_url = normalized.get("image_url", "") or None

        if not name:
            errors.append(ProductImportRowError(row=row_num, message="Name is required"))
            continue
        if not description:
            errors.append(ProductImportRowError(row=row_num, message="Description is required"))
            continue
        if not category:
            errors.append(ProductImportRowError(row=row_num, message="Category is required"))
            continue
        if not price_raw:
            errors.append(ProductImportRowError(row=row_num, message="Price is required"))
            continue

        try:
            price = Decimal(price_raw.replace(",", "").strip())
        except (InvalidOperation, AttributeError):
            errors.append(ProductImportRowError(row=row_num, message=f"Invalid price: {price_raw!r}"))
            continue

        slug = slug_raw or _slugify(name)
        if slug_raw and not re.fullmatch(r"[a-z0-9-]+", slug):
            errors.append(
                ProductImportRowError(
                    row=row_num,
                    message="Slug must contain only lowercase letters, numbers, and hyphens",
                )
            )
            continue

        slug = _unique_slug(slug, used_slugs, existing_slugs)

        try:
            payload = ProductCreate(
                name=name,
                slug=slug,
                description=description,
                price=price,
                category=category,
                image_url=image_url,
            )
        except ValidationError as exc:
            msg = "; ".join(
                f"{'.'.join(str(p) for p in err['loc'])}: {err['msg']}" for err in exc.errors()
            )
            errors.append(ProductImportRowError(row=row_num, message=msg))
            continue

        used_slugs.add(slug)
        existing_slugs.add(slug)
        products.append(Product(**payload.model_dump()))

    return products, errors
