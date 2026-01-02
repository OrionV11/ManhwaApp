from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel, Field
from database import get_db
from controllers import userreview as user_reviews

router = APIRouter(
    prefix="/reviews",
    tags=["reviews"]
)

# -------------------------
# Pydantic Models (Request/Response schemas)
# -------------------------

class ReviewCreate(BaseModel):
    user_id: int
    media_id: int
    content: str = Field(..., min_length=1)
    rating: Optional[float] = Field(None, ge=0, le=10)
    title: Optional[str] = Field(None, max_length=255)

class ReviewUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1)
    rating: Optional[float] = Field(None, ge=0, le=10)
    title: Optional[str] = Field(None, max_length=255)

# -------------------------
# Review Routes
# -------------------------

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_review(review: ReviewCreate, request: Request, db: Session = Depends(get_db)):
    """
    Create a new review for a media item.
    Expects JSON body with user_id, media_id, content, rating, title.
    """
    # Debug: log the body received
    body = await request.json()
    print("Received JSON body:", body)

    try:
        new_review = user_reviews.add_review(
            db=db,
            user_id=review.user_id,
            media_id=review.media_id,
            content=review.content,
            rating=review.rating,
            title=review.title
        )
        return new_review
    except ValueError as e:
        print("Add review error:", e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.put("/{review_id}")
def update_review(
    review_id: int,
    review: ReviewUpdate,
    user_id: int,  # TODO: Replace with authenticated user from token
    db: Session = Depends(get_db)
):
    """Update an existing review"""
    try:
        return user_reviews.update_review(
            db=db,
            review_id=review_id,
            user_id=user_id,
            content=review.content,
            rating=review.rating,
            title=review.title
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{review_id}", status_code=status.HTTP_200_OK)
def delete_review(
    review_id: int,
    user_id: int,  # TODO: Replace with authenticated user from token
    db: Session = Depends(get_db)
):
    """Delete a review"""
    try:
        return user_reviews.remove_review(
            db=db,
            review_id=review_id,
            user_id=user_id
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/user/{user_id}")
def get_user_reviews(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get all reviews by a specific user"""
    try:
        return user_reviews.get_user_reviews(db=db, user_id=user_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.get("/media/{media_id}")
def get_media_reviews(
    media_id: int,
    db: Session = Depends(get_db)
):
    """Get all reviews for a specific media item"""
    try:
        return user_reviews.get_media_reviews(db=db, media_id=media_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

# -------------------------
# Review Like Routes
# -------------------------

@router.post("/{review_id}/like", status_code=status.HTTP_200_OK)
def like_review(
    review_id: int,
    user_id: int,  # TODO: Replace with authenticated user from token
    db: Session = Depends(get_db)
):
    """Like a review"""
    try:
        return user_reviews.add_review_like(
            db=db,
            user_id=user_id,
            review_id=review_id
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{review_id}/like", status_code=status.HTTP_200_OK)
def unlike_review(
    review_id: int,
    user_id: int,  # TODO: Replace with authenticated user from token
    db: Session = Depends(get_db)
):
    """Remove a like from a review"""
    try:
        return user_reviews.remove_review_like(
            db=db,
            user_id=user_id,
            review_id=review_id
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/{review_id}/likes")
def get_review_likes(
    review_id: int,
    db: Session = Depends(get_db)
):
    """Get all users who liked a review"""
    try:
        return user_reviews.get_review_likes(db=db, review_id=review_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.get("/{review_id}/liked")
def check_user_liked_review(
    review_id: int,
    user_id: int,  # TODO: Replace with authenticated user from token
    db: Session = Depends(get_db)
):
    """Check if the current user has liked a review"""
    has_liked = user_reviews.has_user_liked_review(
        db=db,
        user_id=user_id,
        review_id=review_id
    )
    return {"has_liked": has_liked}