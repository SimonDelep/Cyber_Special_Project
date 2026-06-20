from pydantic import BaseModel


class QuotePublic(BaseModel):
    content: str
    author: str
    source: str = "quotable"
