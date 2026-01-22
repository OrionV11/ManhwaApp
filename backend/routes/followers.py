from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from controllers import followers
from dependencies import get_current_user_id

router = APIRouter(
    prefix="/users",
    tags=["followers"]
)

# -------------------------
# Pydantic Models
# -------------------------

class FollowRequest(BaseModel):
    following_id: int

# -------------------------
# Follow/Unfollow Routes
# -------------------------

@router.post("/follow", status_code=status.HTTP_200_OK)
def follow_user(
    follow_request: FollowRequest,  # Add this - get following_id from body
    follower_id: int = Depends(get_current_user_id),  # Current user (from token)
    db: Session = Depends(get_db)
):
    """Follow a user"""
    try:
        return followers.follow_user(
            db=db,
            follower_id=follower_id,  # Current user
            following_id=follow_request.following_id  # User to follow
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/follow/{following_id}", status_code=status.HTTP_200_OK)  # Add following_id to path
def unfollow_user(
    following_id: int,  # User to unfollow (from URL)
    follower_id: int = Depends(get_current_user_id),  # Current user (from token)
    db: Session = Depends(get_db)
):
    """Unfollow a user"""
    try:
        return followers.unfollow_user(
            db=db,
            follower_id=follower_id,
            following_id=following_id
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# -------------------------
# Follower/Following List Routes
# -------------------------

@router.get("/followers")
def get_user_followers(
    user_id: int = Depends(get_current_user_id),  # Current user
    db: Session = Depends(get_db)
):
    """Get all followers of the current user"""
    try:
        return followers.get_followers(db=db, user_id=user_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.get("/following")
def get_user_following(
    user_id: int = Depends(get_current_user_id),  # Current user
    db: Session = Depends(get_db)
):
    """Get all users that the current user is following"""
    try:
        return followers.get_following(db=db, user_id=user_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

# -------------------------
# Stats and Check Routes
# -------------------------

@router.get("/stats")
def get_user_follower_stats(
    user_id: int = Depends(get_current_user_id),  # Current user
    db: Session = Depends(get_db)
):
    """Get follower and following counts for the current user"""
    try:
        return followers.get_user_stats(db=db, user_id=user_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.get("/is-following/{other_user_id}")
def check_is_following(
    other_user_id: int,  # User to check (from URL)
    user_id: int = Depends(get_current_user_id),  # Current user (from token)
    db: Session = Depends(get_db)
):
    """Check if current user is following other_user_id"""
    is_following = followers.is_following(
        db=db,
        follower_id=user_id,
        following_id=other_user_id
    )
    return {"is_following": is_following}

@router.get("/mutual/{other_user_id}")
def get_mutual_followers(
    other_user_id: int,  # Other user (from URL)
    user_id: int = Depends(get_current_user_id),  # Current user (from token)
    db: Session = Depends(get_db)
):
    """Get mutual followers between current user and other_user_id"""
    try:
        return followers.get_mutual_followers(
            db=db,
            user_id=user_id,
            other_user_id=other_user_id
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))