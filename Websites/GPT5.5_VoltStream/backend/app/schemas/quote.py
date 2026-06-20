from pydantic import BaseModel


class QuoteRead(BaseModel):
    quote: str
    author: str
    source: str
