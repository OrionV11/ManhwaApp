from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from controllers.stats import get_user_stats
from dependencies import get_current_user_id

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("/me")
def read_user_stats(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    return get_user_stats(db, user_id)
