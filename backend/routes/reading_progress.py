from fastapi import APIRouter, Depends, HTTPException, status  # Add HTTPException
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user_id
from controllers.reading_progress import get_user_reading_media, get_completed, mark_as_completed

router = APIRouter(prefix="/reading-progress", tags=["reading-progress"])


@router.put("/add/{media_id}")
def add_user_reading_media_route( 
    media_id: int, 
    user_id: int = Depends(get_current_user_id), 
    db: Session = Depends(get_db)):

    from controllers.reading_progress import add_user_reading_media
    return add_user_reading_media(db, user_id, media_id)


@router.get("/me")
def read_user_reading_progress(
    user_id: int = Depends(get_current_user_id), 
    db: Session = Depends(get_db)):
    return get_user_reading_media(db, user_id)


@router.put("/complete/{media_id}", status_code=status.HTTP_200_OK)
def mark_media_completed_route(
    media_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Mark a media as completed"""
    try:
        return mark_as_completed( 
            db=db,
            user_id=user_id,
            media_id=media_id
        )
    except ValueError as e:
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))