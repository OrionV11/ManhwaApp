from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from controllers.reading_progress import get_user_reading_media

router = APIRouter(prefix="/reading-progress", tags=["reading-progress"])


@router.put("/{user_id}/add/{media_id}")
def add_user_reading_media(user_id: int, media_id: int, db: Session = Depends(get_db)):
    from controllers.reading_progress import add_user_reading_media
    return add_user_reading_media(db, user_id, media_id)


@router.get("/{user_id}")
def read_user_reading_progress(user_id: int, db: Session = Depends(get_db)):
    return get_user_reading_media(db, user_id)
