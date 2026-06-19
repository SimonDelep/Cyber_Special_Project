from pydantic import BaseModel

from app.schemas.product import ProductRead


class ProductImportRowError(BaseModel):
    row: int
    message: str


class ProductImportResult(BaseModel):
    created: int
    failed: int
    errors: list[ProductImportRowError]
    products: list[ProductRead]
