from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from controllers.stats import get_user_stats

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("/{user_id}")
def read_user_stats(user_id: int, db: Session = Depends(get_db)):
    return get_user_stats(db, user_id)
