from pydantic import BaseModel

from app.schemas.product import ProductPublic


class ProductImportResult(BaseModel):
    created_count: int
    error_count: int
    errors: list[str]
    products: list[ProductPublic]
