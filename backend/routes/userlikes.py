from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from controllers import userlikes
from dependencies import get_current_user_id 


router = APIRouter(
    prefix="/likes",
    tags=["likes"]
)

# -------------------------
# Pydantic Models (Request/Response schemas)
# -------------------------

class MediaLikeRequest(BaseModel):
    media_id: int

# -------------------------
# Like Routes
# -------------------------

@router.post("/", status_code=status.HTTP_200_OK)
def like_media(
    like_request: MediaLikeRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Add a media to user's likes"""
    try:
        return userlikes.add_like(
            db=db,
            user_id=user_id,
            media_id=like_request.media_id
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{media_id}", status_code=status.HTTP_200_OK)
def unlike_media(
    media_id: int,
    user_id: int,  # TODO: Replace with authenticated user from token
    db: Session = Depends(get_db)
):
    """Remove a media from user's likes"""
    try:
        return userlikes.remove_like(
            db=db,
            user_id=user_id,
            media_id=media_id
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/user")
def get_user_likes(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get all media liked by a specific user"""
    try:
        return userlikes.get_user_likes(db=db, user_id=user_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.get("/media/{media_id}/check")
def check_user_liked_media(
    media_id: int,
    user_id: int,  # TODO: Replace with authenticated user from token
    db: Session = Depends(get_db)
):
    """Check if the current user has liked a specific media"""
    has_liked = userlikes.has_user_liked_media(
        db=db,
        user_id=user_id,
        media_id=media_id
    )
    return {"has_liked": has_liked}