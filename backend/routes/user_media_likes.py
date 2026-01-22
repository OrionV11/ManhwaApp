from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional
from database import get_db
from controllers import user_media_list
from dependencies import get_current_user_id

router = APIRouter(
    prefix="/list",
    tags=["user-media-list"]
)

# -------------------------
# Pydantic Models
# -------------------------

class MediaListCreate(BaseModel):
    media_id: int
    status: str = Field(..., pattern="^(WATCHING|COMPLETED|ON_HOLD|DROPPED|PLAN_TO_WATCH)$")
    score: Optional[float] = Field(None, ge=0, le=10)
    progress: int = Field(default=0, ge=0)
    notes: Optional[str] = None

class MediaListUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(WATCHING|COMPLETED|ON_HOLD|DROPPED|PLAN_TO_WATCH)$")
    score: Optional[float] = Field(None, ge=0, le=10)
    progress: Optional[int] = Field(None, ge=0)
    notes: Optional[str] = None

# -------------------------
# List CRUD Routes
# -------------------------

@router.post("/", status_code=status.HTTP_201_CREATED)
def add_to_list(
    entry: MediaListCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Add a media to user's list"""
    try:
        return user_media_list.add_media_to_list(
            db=db,
            user_id=user_id,
            media_id=entry.media_id,
            status=entry.status,
            score=entry.score,
            progress=entry.progress,
            notes=entry.notes
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.put("/{entry_id}")
def update_list_entry(
    entry_id: int,
    entry: MediaListUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update a media entry in user's list"""
    try:
        return user_media_list.update_media_in_list(
            db=db,
            entry_id=entry_id,
            user_id=user_id,
            status=entry.status,
            score=entry.score,
            progress=entry.progress,
            notes=entry.notes
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{entry_id}")
def remove_from_list(
    entry_id: int,
    user_id: int = Depends(get_current_user_id),  
    db: Session = Depends(get_db)
):
    """Remove a media from user's list"""
    try:
        return user_media_list.remove_media_from_list(
            db=db,
            entry_id=entry_id,
            user_id=user_id
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/user")
def get_user_list(
    user_id: int = Depends(get_current_user_id),
    status: Optional[str] = Query(None, pattern="^(WATCHING|COMPLETED|ON_HOLD|DROPPED|PLAN_TO_WATCH)$"),
    db: Session = Depends(get_db)
):
    """Get user's media list, optionally filtered by status"""
    try:
        return user_media_list.get_user_media_list(
            db=db,
            user_id=user_id,
            status=status
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.get("/user/media/{media_id}")
def get_list_entry(
    media_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get a specific media entry from user's list"""
    entry = user_media_list.get_media_list_entry(
        db=db,
        user_id=user_id,
        media_id=media_id
    )
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found in user's list"
        )
    
    return entry

@router.get("/user/stats")
def get_list_stats(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get statistics about user's media list"""
    try:
        return user_media_list.get_list_statistics(db=db, user_id=user_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))