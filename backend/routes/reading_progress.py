from fastapi import APIRouter, Depends, HTTPException, status  # Add HTTPException
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user_id
from controllers.reading_progress import get_user_reading_media, get_completed, mark_as_completed

from logger import api_logger, error_logger

router = APIRouter(prefix="/reading-progress", tags=["reading-progress"])


@router.put("/add/{media_id}")
def add_user_reading_media_route( 
    media_id: int, 
    user_id: int = Depends(get_current_user_id), 
    db: Session = Depends(get_db)):

    try:
        from controllers.reading_progress import add_user_reading_media
        result = add_user_reading_media(db, user_id, media_id)
        api_logger.info(f"Reading progress added | user={user_id} | media={media_id}")
        return result
    except Exception as e:
        error_logger.error(f"Add reading progress failed | user={user_id} | media={media_id}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/me")
def read_user_reading_progress(
    user_id: int = Depends(get_current_user_id), 
    db: Session = Depends(get_db)):

    try:
        return get_user_reading_media(db, user_id)
    except Exception as e:
        error_logger.error(f"Fetch reading progress failed | user={user_id} | error={e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/complete/{media_id}", status_code=status.HTTP_200_OK)
def mark_media_completed_route(
    media_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Mark a media as completed"""
    try:
        result = mark_as_completed(db=db,user_id=user_id,media_id=media_id)
        api_logger.info(f"Media marked complete | user={user_id} | media={media_id}")
        return result
    except ValueError as e:
        error_logger.error(f"Bad request | user={user_id} | media={media_id}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/completed/me")
def get_user_completed_route(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get all completed media for a user"""
    try:
        return get_completed(  # Changed from reading_progress_controller.get_completed
            db=db,
            user_id=user_id
        )
    except ValueError as e:
        error_logger.error(f"Media not found | user={user_id}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        error_logger.error(f"Fetch completed failed | user={user_id} | error={e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
