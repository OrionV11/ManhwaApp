from fastapi import APIRouter, HTTPException, status, Query
from controllers import media

router = APIRouter(prefix="/api/media", tags=["media"])

@router.get("/search")
def search(query: str = Query(..., min_length=1), type: str = None, genre: str = None):
    try:
        results = media.search_media(query, type, genre)
        return results
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error")

@router.get("/trending")
def trending():
    try:
        results = media.get_trending_media()
        return results
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error")

@router.get("/{media_id}")
def get_media(media_id: int):
    try:
        result = media.get_media_by_id(media_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error")
