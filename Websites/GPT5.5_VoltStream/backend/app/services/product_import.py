import csv
import io
import re
from pydantic import ValidationError

from app.schemas.admin import ProductCreate

REQUIRED_COLUMNS = {"name", "description", "category"}


def _normalize_header(name: str | None) -> str:
    return (name or "").strip().lower().replace(" ", "_")


def _parse_price_cents(row: dict[str, str], line: int) -> tuple[int | None, str | None]:
    cents_raw = row.get("price_cents", "").strip()
    price_raw = row.get("price", "").strip()

    if cents_raw:
        try:
            cents = int(cents_raw)
            if cents < 0:
                return None, f"Line {line}: price_cents must be >= 0"
            return cents, None
        except ValueError:
            return None, f"Line {line}: price_cents must be an integer"

    if price_raw:
        try:
            dollars = float(price_raw.replace(",", "."))
            if dollars < 0:
                return None, f"Line {line}: price must be >= 0"
            return int(round(dollars * 100)), None
        except ValueError:
            return None, f"Line {line}: price must be a number (e.g. 89.99)"

    return None, f"Line {line}: provide price_cents or price"


def _row_to_product(row: dict[str, str], line: int) -> tuple[ProductCreate | None, str | None]:
    name = row.get("name", "").strip()
    description = row.get("description", "").strip()
    category = row.get("category", "").strip().lower()
    image_url = row.get("image_url", "").strip() or None

    price_cents, price_err = _parse_price_cents(row, line)
    if price_err:
        return None, price_err

    try:
        product = ProductCreate(
            name=name,
            description=description,
            category=category,
            price_cents=price_cents or 0,
            image_url=image_url,
        )
        return product, None
    except ValidationError as exc:
        msg = "; ".join(e["msg"] for e in exc.errors())
        return None, f"Line {line}: {msg}"


def parse_products_csv(file_bytes: bytes) -> tuple[list[ProductCreate], list[str]]:
    errors: list[str] = []
    products: list[ProductCreate] = []

    try:
        text = file_bytes.decode("utf-8-sig")
    except UnicodeDecodeError:
        return [], ["File must be UTF-8 encoded CSV"]

    if not text.strip():
        return [], ["CSV file is empty"]

    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        return [], ["Missing header row"]

    headers = {_normalize_header(h) for h in reader.fieldnames}
    missing = REQUIRED_COLUMNS - headers
    if missing:
        return [], [f"Missing required columns: {', '.join(sorted(missing))}"]
    if "price_cents" not in headers and "price" not in headers:
        return [], ["Missing required column: price_cents or price"]

    for line_num, raw_row in enumerate(reader, start=2):
        row = {_normalize_header(k): (v or "").strip() for k, v in raw_row.items()}
        if not any(row.values()):
            continue

        product, err = _row_to_product(row, line_num)
        if err:
            errors.append(err)
            continue
        if product:
            products.append(product)

    if not products and not errors:
        errors.append("No product rows found in CSV")

    return products, errors
