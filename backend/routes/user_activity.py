from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional
from database import get_db
from controllers import user_activity
from dependencies import get_current_user_id

router = APIRouter(
    prefix="/activity",
    tags=["activity"]
)

# -------------------------
# Pydantic Models
# -------------------------

class ActivityCreate(BaseModel):
    media_id: int
    activity_type: str = Field(..., pattern="^(STARTED|COMPLETED|UPDATED_PROGRESS|REVIEWED|LIKED|ADDED)$")
    details: Optional[str] = None

# -------------------------
# Activity Routes
# -------------------------

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_activity(
    activity: ActivityCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Create a new activity entry"""
    try:
        return user_activity.create_activity(
            db=db,
            user_id=user_id,
            media_id=activity.media_id,
            activity_type=activity.activity_type,
            details=activity.details
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/user")
def get_user_activity(
    user_id: int = Depends(get_current_user_id),
    limit: int = Query(50, ge=1, le=100),
    activity_type: Optional[str] = Query(None, pattern="^(STARTED|COMPLETED|UPDATED_PROGRESS|REVIEWED|LIKED|ADDED)$"),
    db: Session = Depends(get_db)
):
    """Get activities for a specific user"""
    try:
        return user_activity.get_user_activities(
            db=db,
            user_id=user_id,
            limit=limit,
            activity_type=activity_type
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.get("/feed")
def get_feed(
    user_id: int = Depends(get_current_user_id),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get activity feed from users that the current user follows"""
    try:
        return user_activity.get_following_feed(
            db=db,
            user_id=user_id,
            limit=limit
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.get("/global")
def get_global_feed(
    limit: int = Query(50, ge=1, le=100),
    activity_type: Optional[str] = Query(None, pattern="^(STARTED|COMPLETED|UPDATED_PROGRESS|REVIEWED|LIKED|ADDED)$"),
    db: Session = Depends(get_db)
):
    """Get global activity feed from all users"""
    return user_activity.get_global_activity_feed(
        db=db,
        limit=limit,
        activity_type=activity_type
    )

@router.get("/media/{media_id}")
def get_media_activity(
    media_id: int,
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get all activities for a specific media"""
    try:
        return user_activity.get_media_activities(
            db=db,
            media_id=media_id,
            limit=limit
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.delete("/{activity_id}")
def delete_activity(
    activity_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Delete an activity"""
    try:
        return user_activity.delete_activity(
            db=db,
            activity_id=activity_id,
            user_id=user_id
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))