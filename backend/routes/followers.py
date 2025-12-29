from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from controllers import followers

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

@router.post("/{user_id}/follow", status_code=status.HTTP_200_OK)
def follow_user(
    user_id: int,
    follower_id: int,  # TODO: Replace with authenticated user from token
    db: Session = Depends(get_db)
):
    """Follow a user"""
    try:
        return followers.follow_user(
            db=db,
            follower_id=follower_id,
            following_id=user_id
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{user_id}/follow", status_code=status.HTTP_200_OK)
def unfollow_user(
    user_id: int,
    follower_id: int,  # TODO: Replace with authenticated user from token
    db: Session = Depends(get_db)
):
    """Unfollow a user"""
    try:
        return followers.unfollow_user(
            db=db,
            follower_id=follower_id,
            following_id=user_id
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# -------------------------
# Follower/Following List Routes
# -------------------------

@router.get("/{user_id}/followers")
def get_user_followers(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get all followers of a user"""
    try:
        return followers.get_followers(db=db, user_id=user_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.get("/{user_id}/following")
def get_user_following(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get all users that a user is following"""
    try:
        return followers.get_following(db=db, user_id=user_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

# -------------------------
# Stats and Check Routes
# -------------------------

@router.get("/{user_id}/stats")
def get_user_follower_stats(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get follower and following counts for a user"""
    try:
        return followers.get_user_stats(db=db, user_id=user_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.get("/{user_id}/is-following/{other_user_id}")
def check_is_following(
    user_id: int,
    other_user_id: int,
    db: Session = Depends(get_db)
):
    """Check if user_id is following other_user_id"""
    is_following = followers.is_following(
        db=db,
        follower_id=user_id,
        following_id=other_user_id
    )
    return {"is_following": is_following}

@router.get("/{user_id}/mutual/{other_user_id}")
def get_mutual_followers(
    user_id: int,
    other_user_id: int,
    db: Session = Depends(get_db)
):
    """Get mutual followers between two users"""
    try:
        return followers.get_mutual_followers(
            db=db,
            user_id=user_id,
            other_user_id=other_user_id
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))