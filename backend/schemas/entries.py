from pydantic import BaseModel
from typing import Optional

class EntryRequest(BaseModel):
    media_id: int
    status: str  # 'WATCHING', 'COMPLETED', 'DROPPED', 'PAUSED', 'PLANNING'
    rating: Optional[float] = None
    review: Optional[str] = None
    episodes_watched: Optional[int] = None

class EntryResponse(BaseModel):
    id: str
    media_id: int
    status: str
    rating: Optional[float]
    review: Optional[str]