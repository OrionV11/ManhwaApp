from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel, Field
from database import get_db
from models import User, Review, Media 
from auth import get_current_user
from controllers import userreview as user_reviews
from dependencies import get_current_user_id


router = APIRouter(
    prefix="/reviews",
    tags=["reviews"]
)


# Create Pydantic model for review creation
class ReviewCreate(BaseModel):
    media_id: int
    content: str
    rating: int
    title: Optional[str] = ""

@router.post("")
async def create_review(
    review_data: ReviewCreate,  # Use Pydantic model instead of dict
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create review - user_id comes from JWT token, NOT from request body"""
    
    print(f"Creating review for user {current_user.id}, media {review_data.media_id}")
    
    # Check if user already reviewed this media
    existing_review = db.query(Review).filter(
        Review.user_id == current_user.id,
        Review.media_id == review_data.media_id
    ).first()
    
    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already reviewed this media"
        )
    
    # Create review with user_id from token
    review = Review(
        user_id=current_user.id,  # ✅ From token, not request body!
        media_id=review_data.media_id,
        content=review_data.content,
        rating=review_data.rating,
        title=review_data.title or ""
    )
    
    db.add(review)
    db.commit()
    db.refresh(review)
    
    # Return full review with media info
    media = db.query(Media).filter(Media.id == review.media_id).first()
    
    return {
        "review_id": review.id,
        "user_id": review.user_id,
        "media_id": review.media_id,
        "rating": review.rating,
        "content": review.content,
        "title": review.title,
        "created_at": review.created_at.isoformat(),
        "media": {
            "id": media.id,
            "title_english": media.title_english,
            "title_romaji": media.title_romaji,
            "cover_image": media.cover_image,
            "type": media.type,
        } if media else None
    }

@router.get("/me")  
async def get_my_reviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get authenticated user's reviews"""
    
    reviews = db.query(Review).filter(
        Review.user_id == current_user.id
    ).all()
    
    result = []
    for review in reviews:
        media = db.query(Media).filter(Media.id == review.media_id).first()
        result.append({
            "review_id": review.id,
            "media_id": review.media_id,
            "rating": review.rating,
            "content": review.content,
            "title": review.title,
            "created_at": review.created_at.isoformat(),
            "likes_count": getattr(review, 'likes_count', 0),
            "media": {
                "id": media.id,
                "title_english": media.title_english,
                "title_romaji": media.title_romaji,
                "cover_image": media.cover_image,
                "type": media.type,
            } if media else None
        })
    
    return result

@router.delete("/{review_id}")
async def delete_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete review - users can only delete their own reviews"""
    
    review = db.query(Review).filter(Review.id == review_id).first()
    
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    # Security check: user can only delete their own reviews
    if review.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own reviews"
        )
    
    db.delete(review)
    db.commit()
    
    return {"message": "Review deleted successfully"}

@router.put("/{review_id}")
async def update_review(
    review_id: int,
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update review - users can only update their own reviews"""
    
    review = db.query(Review).filter(Review.id == review_id).first()
    
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    # Security check
    if review.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own reviews"
        )
    
    # Update fields
    review.content = review_data.content
    review.rating = review_data.rating
    review.title = review_data.title or ""
    review.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(review)
    
    return {"message": "Review updated successfully"}

# -------------------------
# Review Like Routes
# -------------------------

@router.post("/{review_id}/like", status_code=status.HTTP_200_OK)
def like_review(
    review_id: int,
    user_id: int = Depends(get_current_user_id),  # TODO: Replace with authenticated user from token
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
    user_id: int = Depends(get_current_user_id),  # TODO: Replace with authenticated user from token
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

# backend/routes/reviews.py

@router.get("/public")
def get_public_reviews(
    sort: str = "popular",  # popular, recent, rating
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get public reviews sorted by popularity"""
    
    query = db.query(Review)
    
    # Sort by different criteria
    if sort == "popular":
        query = query.order_by(Review.likes_count.desc())
    elif sort == "recent":
        query = query.order_by(Review.created_at.desc())
    elif sort == "rating":
        query = query.order_by(Review.rating.desc())
    
    reviews = query.limit(limit).all()
    
    result = []
    for review in reviews:
        user = db.query(User).filter(User.id == review.user_id).first()
        media = db.query(Media).filter(Media.id == review.media_id).first()
        
        if user and media:
            result.append({
                "id": review.id,
                "rating": float(review.rating) if review.rating else None,
                "title": review.title,
                "content": review.content,
                "likes_count": review.likes_count or 0,
                "created_at": review.created_at.isoformat(),
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "profile_picture": user.profile_picture,
                },
                "media": {
                    "id": media.id,
                    "title_english": media.title_english,
                    "title_romaji": media.title_romaji,
                    "cover_image": media.cover_image,
                    "type": media.type,
                },
            })
    
    return result
