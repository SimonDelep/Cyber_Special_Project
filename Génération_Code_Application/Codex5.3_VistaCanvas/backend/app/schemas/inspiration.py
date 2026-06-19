from pydantic import BaseModel


class ApodItem(BaseModel):
    title: str
    explanation: str
    image_url: str | None
    page_url: str
    date: str
    copyright: str | None
    source: str = "NASA Astronomy Picture of the Day"


class ScenicWeather(BaseModel):
    location: str
    temperature_c: float
    weather_label: str
    wind_speed_kmh: float
    sunrise: str | None = None
    sunset: str | None = None


class NatureQuote(BaseModel):
    content: str
    author: str
    source: str = "ZenQuotes"


class InspirationFeed(BaseModel):
    apod: ApodItem | None
    scenic_weather: list[ScenicWeather]
    quote: NatureQuote | None = None
    apod_error: str | None = None
    weather_error: str | None = None
    quote_error: str | None = None
