# routes/favorites.py

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from database import get_db
from controllers import favorites
from dependencies import get_current_user_id

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.put("/add/{media_id}")
def add_to_favorites(media_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    try:
        result = favorites.add_favorite(db, user_id, media_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete("/remove/{media_id}")
def remove_from_favorites(media_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    try:
        result = favorites.remove_favorite(db, user_id, media_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/")
def get_favorites(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    try:
        result = favorites.get_user_favorites(db, user_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
