from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from controllers.reading_progress import get_user_reading_media

router = APIRouter(prefix="/reading-progress", tags=["reading-progress"])


@router.get("/{user_id}")
def read_user_reading_progress(user_id: int, db: Session = Depends(get_db)):
    return get_user_reading_media(db, user_id)
