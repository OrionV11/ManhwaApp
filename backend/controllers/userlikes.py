from sqlalchemy.orm import Session
from backend.models import User, Media, MediaLike
from typing import List, Dict
from controllers.media import media_to_dict

def add_like(db: Session, user_id: int, media_id: int) -> Dict:
    """Add a media to a user's likes"""
    user = db.query(User).filter(User.id == user_id).first()
    media = db.query(Media).filter(Media.id == media_id).first()

    if not user:
        raise ValueError(f"User with id {user_id} not found")
    if not media:
        raise ValueError(f"Media with id {media_id} not found")

    # Check if already liked using the MediaLike table directly (more explicit)
    existing_like = db.query(MediaLike).filter(
        MediaLike.user_id == user_id,
        MediaLike.media_id == media_id
    ).first()
    
    if existing_like:
        return {"message": "Media already liked", "user_id": user.id, "media_id": media.id}

    # Create the like
    media_like = MediaLike(user_id=user_id, media_id=media_id)
    db.add(media_like)
    
    # Update media popularity/favorites count if you want
    media.favorites += 1
    
    db.commit()
    db.refresh(user)
    
    return {
        "message": "Media added to likes",
        "user_id": user.id,
        "media_id": media.id,
        "created_at": media_like.created_at
    }

def remove_like(db: Session, user_id: int, media_id: int) -> Dict:
    """Remove a media from a user's likes"""
    user = db.query(User).filter(User.id == user_id).first()
    media = db.query(Media).filter(Media.id == media_id).first()

    if not user:
        raise ValueError(f"User with id {user_id} not found")
    if not media:
        raise ValueError(f"Media with id {media_id} not found")

    # Find the like entry
    media_like = db.query(MediaLike).filter(
        MediaLike.user_id == user_id,
        MediaLike.media_id == media_id
    ).first()
    
    if not media_like:
        return {"message": "Media not in likes", "user_id": user.id, "media_id": media.id}

    # Remove the like
    db.delete(media_like)
    
    # Update media favorites count
    if media.favorites > 0:
        media.favorites -= 1
    
    db.commit()
    
    return {"message": "Media removed from likes", "user_id": user.id, "media_id": media.id}

def get_user_likes(db: Session, user_id: int) -> List[Dict]:
    """
    Returns a list of media liked by the user with full details.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError(f"User with id {user_id} not found")

    # Convert to dict format for consistency with other endpoints
    return [media_to_dict(media) for media in user.favorites]

def has_user_liked_media(db: Session, user_id: int, media_id: int) -> bool:
    """Check if a user has liked a specific media"""
    like = db.query(MediaLike).filter(
        MediaLike.user_id == user_id,
        MediaLike.media_id == media_id
    ).first()
    return like is not None