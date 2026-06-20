from fastapi import APIRouter

from app.schemas.inspiration import ApodItem, InspirationFeed, NatureQuote, ScenicWeather
from app.services.open_apis import (
    fetch_nasa_apod,
    fetch_nature_quote,
    fetch_scenic_weather,
    fetch_picsum_landscape,
)

router = APIRouter(prefix="/inspiration", tags=["inspiration"])


@router.get("", response_model=InspirationFeed)
async def get_inspiration_feed() -> InspirationFeed:
    """Landscape-themed live feed from NASA APOD and Open-Meteo (no API keys required)."""
    apod: ApodItem | None = None
    apod_error: str | None = None
    scenic_weather: list[ScenicWeather] = []
    weather_error: str | None = None
    quote: NatureQuote | None = None
    quote_error: str | None = None

    try:
        data = await fetch_nasa_apod()
        if data.get("media_type") == "image":
            image_url = data.get("hdurl") or data.get("url")
            explanation = str(data.get("explanation", ""))
            if len(explanation) > 400:
                explanation = explanation[:397] + "..."
            apod = ApodItem(
                title=str(data.get("title", "Astronomy Picture of the Day")),
                explanation=explanation,
                image_url=image_url,
                page_url=str(data.get("url", "https://apod.nasa.gov/apod/")),
                date=str(data.get("date", "")),
                copyright=data.get("copyright"),
            )
        else:
            apod_error = "Today's NASA feature is a video — trying fallback."
            raise ValueError(apod_error)
    except Exception:
        try:
            fallback = await fetch_picsum_landscape()
            apod = ApodItem(**fallback)
            apod_error = None
        except Exception as exc:
            apod_error = f"Could not load sky or landscape image: {exc}"

    try:
        rows = await fetch_scenic_weather()
        scenic_weather = [ScenicWeather(**row) for row in rows]
    except Exception as exc:
        weather_error = f"Could not load scenic weather: {exc}"

    try:
        q = await fetch_nature_quote()
        quote = NatureQuote(content=q["content"], author=q["author"])
    except Exception as exc:
        quote_error = f"Could not load quote: {exc}"

    return InspirationFeed(
        apod=apod,
        scenic_weather=scenic_weather,
        quote=quote,
        apod_error=apod_error,
        weather_error=weather_error,
        quote_error=quote_error,
    )
