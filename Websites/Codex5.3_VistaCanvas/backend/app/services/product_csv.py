import csv
import io
import re
from decimal import Decimal, InvalidOperation

from app.models.product import Product

REQUIRED_COLUMNS = {"slug", "name", "description", "category", "price"}
OPTIONAL_COLUMNS = {"image_url"}
ALLOWED_COLUMNS = REQUIRED_COLUMNS | OPTIONAL_COLUMNS
SLUG_PATTERN = re.compile(r"^[a-z0-9-]+$")


def parse_products_csv(content: str, existing_slugs: set[str]) -> tuple[list[dict], list[str]]:
    """Parse CSV text into product dicts. Returns (rows_to_create, error_messages)."""
    reader = csv.DictReader(io.StringIO(content))
    if not reader.fieldnames:
        return [], ["CSV file is empty or missing a header row."]

    headers = {h.strip() for h in reader.fieldnames if h}
    missing = REQUIRED_COLUMNS - headers
    if missing:
        return [], [f"Missing required columns: {', '.join(sorted(missing))}"]

    unknown = headers - ALLOWED_COLUMNS
    if unknown:
        return [], [f"Unknown columns: {', '.join(sorted(unknown))}"]

    to_create: list[dict] = []
    errors: list[str] = []
    seen_slugs: set[str] = set()

    for row_num, row in enumerate(reader, start=2):
        slug = (row.get("slug") or "").strip()
        name = (row.get("name") or "").strip()
        description = (row.get("description") or "").strip()
        category = (row.get("category") or "").strip()
        price_raw = (row.get("price") or "").strip()
        image_url = (row.get("image_url") or "").strip() or None

        if not any([slug, name, description, category, price_raw]):
            continue

        if not slug:
            errors.append(f"Row {row_num}: slug is required")
            continue
        if not SLUG_PATTERN.match(slug):
            errors.append(f"Row {row_num}: invalid slug '{slug}' (use lowercase letters, numbers, hyphens)")
            continue
        if slug in seen_slugs:
            errors.append(f"Row {row_num}: duplicate slug '{slug}' in file")
            continue
        if slug in existing_slugs:
            errors.append(f"Row {row_num}: slug '{slug}' already exists in catalog")
            continue

        if not name:
            errors.append(f"Row {row_num}: name is required")
            continue
        if not description:
            errors.append(f"Row {row_num}: description is required")
            continue
        if not category:
            errors.append(f"Row {row_num}: category is required")
            continue

        try:
            price = Decimal(price_raw)
            if price <= 0:
                raise InvalidOperation()
        except (InvalidOperation, ValueError):
            errors.append(f"Row {row_num}: invalid price '{price_raw}'")
            continue

        seen_slugs.add(slug)
        to_create.append(
            {
                "slug": slug,
                "name": name[:200],
                "description": description,
                "category": category[:80],
                "price": price,
                "image_url": image_url[:500] if image_url else None,
            }
        )

    if not to_create and not errors:
        errors.append("No product rows found in CSV.")

    return to_create, errors


def import_products_from_csv(db, content: str) -> tuple[list[Product], list[str], int]:
    existing = {p.slug for p in db.query(Product).all()}
    rows, parse_errors = parse_products_csv(content, existing)
    if parse_errors and not rows:
        return [], parse_errors, 0

    created: list[Product] = []
    for data in rows:
        product = Product(**data)
        db.add(product)
        created.append(product)
        existing.add(data["slug"])

    if created:
        db.commit()
        for product in created:
            db.refresh(product)

    return created, parse_errors, len(created)
