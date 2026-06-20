import json
import random
import urllib.error
import urllib.parse
import urllib.request

from app.schemas.quote import QuotePublic

FALLBACK_QUOTES: list[QuotePublic] = [
    QuotePublic(
        content="Good food is the foundation of genuine happiness.",
        author="Auguste Escoffier",
        source="zestzing",
    ),
    QuotePublic(
        content="Where there is good food, there is happiness.",
        author="Sophie Dahl",
        source="zestzing",
    ),
    QuotePublic(
        content="Spice a dish with love and it pleases every palate.",
        author="Plautus",
        source="zestzing",
    ),
    QuotePublic(
        content="One cannot think well, love well, sleep well, if one has not dined well.",
        author="Virginia Woolf",
        source="zestzing",
    ),
    QuotePublic(
        content="People who love to eat are always the best people.",
        author="Julia Child",
        source="zestzing",
    ),
]


def _http_get_json(url: str, timeout: int = 8) -> object:
    req = urllib.request.Request(url, headers={"User-Agent": "ZestZing/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode())


def _from_dummyjson(data: dict, limit: int) -> list[QuotePublic]:
    quotes = []
    for item in data.get("quotes", [])[:limit]:
        content = item.get("quote", "").strip()
        author = item.get("author", "Unknown").strip()
        if content:
            quotes.append(QuotePublic(content=content, author=author, source="dummyjson"))
    return quotes


def _from_quotable(data: object) -> list[QuotePublic]:
    if isinstance(data, list):
        items = data
    elif isinstance(data, dict):
        if "content" in data:
            items = [data]
        else:
            items = data.get("results", [])
    else:
        return []

    quotes = []
    for item in items:
        content = item.get("content", "").strip()
        author = item.get("author", "Unknown").strip()
        if content:
            quotes.append(QuotePublic(content=content, author=author, source="quotable"))
    return quotes


def get_quotes(limit: int = 3) -> list[QuotePublic]:
    limit = max(1, min(limit, 10))
    skip = random.randint(0, max(0, 140 - limit))

    sources = [
        (
            f"https://dummyjson.com/quotes?limit={limit}&skip={skip}",
            lambda d: _from_dummyjson(d, limit),
        ),
        (
            f"https://api.quotable.io/quotes/random?limit={limit}&maxLength=180",
            _from_quotable,
        ),
        (
            "https://api.quotable.io/quotes?"
            + urllib.parse.urlencode({"query": "food flavor eat", "limit": limit}),
            _from_quotable,
        ),
    ]

    for url, parser in sources:
        try:
            data = _http_get_json(url)
            quotes = parser(data)
            if quotes:
                return quotes[:limit]
        except (urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError, TimeoutError):
            continue

    shuffled = FALLBACK_QUOTES.copy()
    random.shuffle(shuffled)
    return shuffled[:limit]
