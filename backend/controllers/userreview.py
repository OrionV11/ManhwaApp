from sqlalchemy.orm import Session
from models import User, Media, Review, ReviewLike
from typing import List, Dict, Optional
from controllers.media import media_to_dict

# -------------------------
# Review CRUD Operations
# -------------------------

def add_review(db: Session, user_id: int, media_id: int, content: str, 
               rating: Optional[float] = None, title: Optional[str] = None) -> Dict:
    """Add a review for a media by a user"""
    user = db.query(User).filter(User.id == user_id).first()
    media = db.query(Media).filter(Media.id == media_id).first()

    if not user:
        raise ValueError(f"User with id {user_id} not found")
    if not media:
        raise ValueError(f"Media with id {media_id} not found")
    
    # Check if review already exists
    existing_review = db.query(Review).filter(
        Review.user_id == user_id,
        Review.media_id == media_id
    ).first()
    
    if existing_review:
        raise ValueError("Review already exists for this media")

    review = Review(
        user_id=user_id,
        media_id=media_id,
        content=content,
        rating=rating,
        title=title
    )
    
    db.add(review)
    db.commit()
    db.refresh(review)

    from models import UserActivity
    activity = UserActivity(
        user_id=user_id,
        media_id=media_id,
        activity_type="REVIEWED",
        details=f"Rated {rating}/10" if rating else None
    )

    db.add(activity)
    db.commit()
    
    return {
        "message": "Review added",
        "review_id": review.id,
        "user_id": user.id,
        "media_id": media.id,
        "content": content,
        "rating": rating,
        "title": title,
        "created_at": review.created_at
    }

def update_review(db: Session, review_id: int, user_id: int, 
                  content: Optional[str] = None, rating: Optional[float] = None, 
                  title: Optional[str] = None) -> Dict:
    """Update an existing review"""
    review = db.query(Review).filter(Review.id == review_id).first()
    
    if not review:
        raise ValueError(f"Review with id {review_id} not found")
    
    if review.user_id != user_id:
        raise ValueError("You can only update your own reviews")
    
    if content is not None:
        review.content = content
    if rating is not None:
        review.rating = rating
    if title is not None:
        review.title = title
    
    db.commit()
    db.refresh(review)
    
    return {
        "message": "Review updated",
        "review_id": review.id,
        "content": review.content,
        "rating": review.rating,
        "title": review.title,
        "updated_at": review.updated_at
    }

def remove_review(db: Session, review_id: int, user_id: int) -> Dict:
    """Remove a review"""
    review = db.query(Review).filter(Review.id == review_id).first()

    if not review:
        raise ValueError(f"Review with id {review_id} not found")
    
    if review.user_id != user_id:
        raise ValueError("You can only delete your own reviews")

    from models import UserActivity
    db.query(UserActivity).filter(
        UserActivity.user_id == user_id,
        UserActivity.media_id == review.media_id,
        UserActivity.activity_type == "REVIEWED"
    ).delete()

    db.delete(review)
    db.commit()
    
    return {"message": "Review removed", "review_id": review_id}

def get_user_reviews(db: Session, user_id: int) -> List[Dict]:
    """
    Returns a list of reviews made by the user.
    Each review includes media details and review information.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError(f"User with id {user_id} not found")

    reviews = db.query(Review).filter(Review.user_id == user_id).all()
    
    reviews_list = []
    for review in reviews:
        review_dict = {
            "review_id": review.id,
            "content": review.content,
            "rating": review.rating,
            "title": review.title,
            "likes_count": review.likes_count,
            "created_at": review.created_at,
            "updated_at": review.updated_at,
        }
        
        if review.media:
            review_dict["media"] = media_to_dict(review.media)
        
        reviews_list.append(review_dict)

    return reviews_list

def get_media_reviews(db: Session, media_id: int) -> List[Dict]:
    """Get all reviews for a specific media"""
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise ValueError(f"Media with id {media_id} not found")
    
    reviews = db.query(Review).filter(Review.media_id == media_id).all()
    
    reviews_list = []
    for review in reviews:
        reviews_list.append({
            "review_id": review.id,
            "user_id": review.user_id,
            "username": review.user.username,
            "content": review.content,
            "rating": review.rating,
            "title": review.title,
            "likes_count": review.likes_count,
            "created_at": review.created_at,
            "updated_at": review.updated_at
        })
    
    return reviews_list

# -------------------------
# Review Like Operations
# -------------------------

def add_review_like(db: Session, user_id: int, review_id: int) -> Dict:
    """Add a like to a review"""
    user = db.query(User).filter(User.id == user_id).first()
    review = db.query(Review).filter(Review.id == review_id).first()
    
    if not user:
        raise ValueError(f"User with id {user_id} not found")
    if not review:
        raise ValueError(f"Review with id {review_id} not found")
    
    # Check if already liked
    existing_like = db.query(ReviewLike).filter(
        ReviewLike.user_id == user_id,
        ReviewLike.review_id == review_id
    ).first()
    
    if existing_like:
        return {
            "message": "Already liked",
            "review_id": review_id,
            "likes_count": review.likes_count
        }
    
    # Create new like
    review_like = ReviewLike(user_id=user_id, review_id=review_id)
    review.likes_count += 1
    
    db.add(review_like)
    db.commit()
    db.refresh(review)
    
    return {
        "message": "Like added",
        "review_id": review_id,
        "likes_count": review.likes_count
    }

def remove_review_like(db: Session, user_id: int, review_id: int) -> Dict:
    """Remove a like from a review"""
    review_like = db.query(ReviewLike).filter(
        ReviewLike.user_id == user_id,
        ReviewLike.review_id == review_id
    ).first()
    
    if not review_like:
        raise ValueError("Like not found")
    
    review = db.query(Review).filter(Review.id == review_id).first()
    if review and review.likes_count > 0:
        review.likes_count -= 1
    
    db.delete(review_like)
    db.commit()
    
    return {
        "message": "Like removed",
        "review_id": review_id,
        "likes_count": review.likes_count if review else 0
    }

def get_review_likes(db: Session, review_id: int) -> List[Dict]:
    """Get all users who liked a review"""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise ValueError(f"Review with id {review_id} not found")
    
    likes = db.query(ReviewLike).filter(ReviewLike.review_id == review_id).all()
    
    return [
        {
            "user_id": like.user_id,
            "created_at": like.created_at
        }
        for like in likes
    ]

def has_user_liked_review(db: Session, user_id: int, review_id: int) -> bool:
    """Check if a user has liked a specific review"""
    like = db.query(ReviewLike).filter(
        ReviewLike.user_id == user_id,
        ReviewLike.review_id == review_id
    ).first()
    return like is not None