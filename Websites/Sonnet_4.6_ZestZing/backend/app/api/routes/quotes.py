from fastapi import APIRouter, Query

from app.schemas.quote import QuotePublic
from app.services.quotes import get_quotes

router = APIRouter(prefix="/quotes", tags=["quotes"])


@router.get("", response_model=list[QuotePublic])
def list_quotes(limit: int = Query(default=3, ge=1, le=10)):
    return get_quotes(limit)
