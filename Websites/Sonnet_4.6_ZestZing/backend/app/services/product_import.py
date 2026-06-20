import csv
import io
from decimal import Decimal, InvalidOperation

from sqlalchemy.orm import Session

from app.models.product import Product, ProductCategory
from app.schemas.product import ProductImportResult, ProductImportRowError
from app.utils.slug import slugify, unique_product_slug

REQUIRED_COLUMNS = {"name", "category", "price"}
VALID_CATEGORIES = {c.value for c in ProductCategory}


def _normalize_header(name: str) -> str:
    return name.strip().lower().replace(" ", "_")


def parse_and_import_products(db: Session, file_content: bytes) -> ProductImportResult:
    text = file_content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))

    if not reader.fieldnames:
        return ProductImportResult(
            created=0,
            failed=0,
            errors=[ProductImportRowError(row=0, error="CSV file is empty or missing a header row")],
        )

    headers = {_normalize_header(h) for h in reader.fieldnames if h}
    missing = REQUIRED_COLUMNS - headers
    if missing:
        return ProductImportResult(
            created=0,
            failed=0,
            errors=[
                ProductImportRowError(
                    row=0,
                    error=f"Missing required columns: {', '.join(sorted(missing))}",
                )
            ],
        )

    created_count = 0
    errors: list[ProductImportRowError] = []

    for row_num, raw_row in enumerate(reader, start=2):
        if not any((v or "").strip() for v in raw_row.values()):
            continue

        try:
            row = {_normalize_header(k): (v or "").strip() for k, v in raw_row.items() if k}

            name = row.get("name", "")
            if not name:
                raise ValueError("name is required")

            category_raw = row.get("category", "")
            price_raw = row.get("price", "")
            description = row.get("description", "")
            slug_val = row.get("slug", "")
            image_url = row.get("image_url") or None

            if not category_raw:
                raise ValueError("category is required")
            category_key = category_raw.lower().replace(" ", "_").replace("-", "_")
            if category_key not in VALID_CATEGORIES:
                raise ValueError(
                    f"invalid category '{category_raw}' (use: hot_sauce, truffle_oil, spice_blend)"
                )

            if not price_raw:
                raise ValueError("price is required")
            try:
                price = Decimal(price_raw.replace("$", "").replace(",", "").strip())
            except InvalidOperation as exc:
                raise ValueError(f"invalid price '{price_raw}'") from exc
            if price <= 0:
                raise ValueError("price must be greater than 0")

            base_slug = slug_val or slugify(name)
            slug = unique_product_slug(db, base_slug)

            product = Product(
                name=name,
                slug=slug,
                description=description,
                category=ProductCategory(category_key),
                price=price,
                image_url=image_url or None,
            )
            db.add(product)
            db.flush()
            created_count += 1
        except Exception as exc:
            errors.append(ProductImportRowError(row=row_num, error=str(exc)))

    if created_count:
        db.commit()
    else:
        db.rollback()

    return ProductImportResult(
        created=created_count,
        failed=len(errors),
        errors=errors,
    )
