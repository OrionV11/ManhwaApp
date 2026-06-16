# routes/favorites.py

from models import User, Media, UserActivity
from fastapi import APIRouter, Request, HTTPException, Depends, status
from sqlalchemy.orm import Session
from database import get_db
from controllers import favorites
from dependencies import get_current_user_id

from logger import api_logger, error_logger
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.put("/add/{media_id}")
@limiter.limit("60/minute")
def add_to_favorites(request: Request, media_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    try:
        result = favorites.add_favorite(db, user_id, media_id)
        
        # Record activity
        activity = UserActivity(
            user_id=user_id,
            media_id=media_id,
            activity_type="LIKED"
        )
        db.add(activity)
        db.commit()

        api_logger.info(f"User add media | user={user_id} | media={media_id}")
        return result
    except ValueError as e:
        error_logger.error(f"Media/User not found | user={user_id} | media={media_id}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        error_logger.error(f"Add media failed | user={user_id} | media={media_id}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete("/remove/{media_id}")
def remove_from_favorites(media_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    try:
        result = favorites.remove_favorite(db, user_id, media_id)
        api_logger.info(f"Media removed | user={user_id} | media={media_id}")
        return result
    except ValueError as e:
        error_logger.error(f"Media/User not found | user={user_id} | media={media_id}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        error_logger.error(f"Media failed to remove | user={user_id} | media={media_id}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/me")
def get_favorites(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    try:
        result = favorites.get_user_favorites(db, user_id)
        return result
    except ValueError as e:
        error_logger.warning(f"Favorites not found | user={user_id}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        error_logger.error(f"Fetch favorites failed | user={user_id} | error={e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
