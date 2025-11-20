from pydantic import BaseModel
from typing import Optional, List

class MediaResponse(BaseModel):
    id: int
    type: str
    title_romaji: str
    title_english: Optional[str]
    description: Optional[str]
    genres: Optional[List[str]]
    average_score: Optional[float]
    popularity_rank: Optional[int]
    episodes: Optional[int]
    chapters: Optional[int]