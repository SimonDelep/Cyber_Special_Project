from pydantic import HttpUrl


def normalize_image_url(value: str | None) -> str | None:
    if value is None:
        return None
    if not value.strip():
        return None
    trimmed = value.strip()
    if trimmed.startswith("/api/uploads/"):
        return trimmed
    HttpUrl(trimmed)
    return trimmed
