import csv
import io
import re
from decimal import Decimal, InvalidOperation

from sqlalchemy.orm import Session

from app.schemas.admin import ProductCreate
from app.services.product_admin import ProductError, create_product

REQUIRED_COLUMNS = {"name", "category", "price"}
OPTIONAL_COLUMNS = {"description", "slug", "image_url"}
ALLOWED_COLUMNS = REQUIRED_COLUMNS | OPTIONAL_COLUMNS
SLUG_PATTERN = re.compile(r"^[a-z0-9-]+$")
MAX_ROWS = 500


class CsvImportError(Exception):
    pass


def _normalize_header(name: str) -> str:
    return name.strip().lower().replace(" ", "_")


def _parse_row(row: dict[str, str], line_no: int) -> ProductCreate:
    name = (row.get("name") or "").strip()
    if not name:
        raise ValueError("name is required")

    category = (row.get("category") or "").strip()
    if not category:
        raise ValueError("category is required")

    price_raw = (row.get("price") or "").strip()
    if not price_raw:
        raise ValueError("price is required")
    try:
        price = Decimal(price_raw)
    except InvalidOperation as e:
        raise ValueError(f"invalid price '{price_raw}'") from e
    if price <= 0:
        raise ValueError("price must be greater than 0")

    description = (row.get("description") or "").strip()
    slug = (row.get("slug") or "").strip() or None
    if slug and not SLUG_PATTERN.match(slug):
        raise ValueError("slug must contain only lowercase letters, numbers, and hyphens")

    image_url = (row.get("image_url") or "").strip() or None

    return ProductCreate(
        name=name,
        category=category,
        price=price,
        description=description,
        slug=slug,
        image_url=image_url,
    )


def import_products_from_csv(db: Session, content: bytes) -> tuple[list, list[dict]]:
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError as e:
        raise CsvImportError("File must be UTF-8 encoded CSV") from e

    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise CsvImportError("CSV file is empty or missing a header row")

    headers = {_normalize_header(h) for h in reader.fieldnames if h}
    unknown = headers - ALLOWED_COLUMNS
    if unknown:
        raise CsvImportError(f"Unknown column(s): {', '.join(sorted(unknown))}")
    missing = REQUIRED_COLUMNS - headers
    if missing:
        raise CsvImportError(f"Missing required column(s): {', '.join(sorted(missing))}")

    created = []
    errors: list[dict] = []
    row_count = 0

    for line_no, raw_row in enumerate(reader, start=2):
        if not any((v or "").strip() for v in raw_row.values()):
            continue

        row_count += 1
        if row_count > MAX_ROWS:
            raise CsvImportError(f"Maximum {MAX_ROWS} product rows per file")

        normalized = {_normalize_header(k): (v or "") for k, v in raw_row.items() if k}

        try:
            data = _parse_row(normalized, line_no)
            product = create_product(db, data)
            created.append(product)
        except ProductError as e:
            errors.append({"row": line_no, "message": str(e)})
        except ValueError as e:
            errors.append({"row": line_no, "message": str(e)})

    if row_count == 0:
        raise CsvImportError("No product rows found in CSV")

    return created, errors
