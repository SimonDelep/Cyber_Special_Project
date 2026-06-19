import httpx
from fastapi import APIRouter

from app.schemas.quote import QuoteRead

router = APIRouter(prefix="/quote", tags=["quote"])

DUMMYJSON_URL = "https://dummyjson.com/quotes/random"
FALLBACK = QuoteRead(
    quote="The only way to do great work is to love what you do.",
    author="Steve Jobs",
    source="fallback",
)


@router.get("", response_model=QuoteRead)
async def get_random_quote():
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(DUMMYJSON_URL)
            response.raise_for_status()
            data = response.json()
            quote = str(data.get("quote", "")).strip()
            author = str(data.get("author", "Unknown")).strip()
            if quote:
                return QuoteRead(quote=quote, author=author or "Unknown", source="dummyjson.com")
    except (httpx.HTTPError, KeyError, TypeError, ValueError):
        pass
    return FALLBACK
