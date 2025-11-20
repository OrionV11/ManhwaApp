from fastapi import APIRouter, HTTPException, status, Query, Depends
from schemas.entries import EntryRequest
from middleware.auth import get_current_user
from controllers import entries

router = APIRouter(prefix="/api/entries", tags=["entries"])

@router.post("/")
def add_entry(data: EntryRequest, user_id: str = Depends(get_current_user)):
    try:
        result = entries.add_entry(
            user_id, data.media_id, data.status, 
            data.rating, data.review, data.episodes_watched
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error")

@router.get("/")
def get_entries(status: str = Query(None), user_id: str = Depends(get_current_user)):
    try:
        results = entries.get_user_entries(user_id, status)
        return results
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error")

@router.delete("/{media_id}")
def delete_entry(media_id: int, user_id: str = Depends(get_current_user)):
    try:
        result = entries.delete_entry(user_id, media_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error")
