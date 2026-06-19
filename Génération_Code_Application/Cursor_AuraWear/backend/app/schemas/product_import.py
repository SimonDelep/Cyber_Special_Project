from pydantic import BaseModel, Field


class ProductImportRowError(BaseModel):
    row: int
    message: str


class ProductImportResponse(BaseModel):
    created: int
    failed: int
    errors: list[ProductImportRowError] = Field(default_factory=list)
