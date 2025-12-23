from sqlalchemy.orm import Session
from models import User, Media
from typing import List, Dict
from controllers.media import media_to_dict

def add_favorite(db: Session, user_id: int, media_id: int) -> Dict:
    """Add a media to a user's favorites"""
    user = db.query(User).filter(User.id == user_id).first()
    media = db.query(Media).filter(Media.id == media_id).first()

    if not user:
        raise ValueError(f"User with id {user_id} not found")
    if not media:
        raise ValueError(f"Media with id {media_id} not found")

    if media in user.favorites:
        return {"message": "Media already in favorites", "user_id": user.id, "media_id": media.id}

    user.favorites.append(media)
    db.commit()
    db.refresh(user)
    return {"message": "Media added to favorites", "user_id": user.id, "media_id": media.id}


def remove_favorite(db: Session, user_id: int, media_id: int) -> Dict:
    """Remove a media from a user's favorites"""
    user = db.query(User).filter(User.id == user_id).first()
    media = db.query(Media).filter(Media.id == media_id).first()

    if not user:
        raise ValueError(f"User with id {user_id} not found")
    if not media:
        raise ValueError(f"Media with id {media_id} not found")

    if media not in user.favorites:
        return {"message": "Media not in favorites", "user_id": user.id, "media_id": media.id}

    user.favorites.remove(media)
    db.commit()
    db.refresh(user)
    return {"message": "Media removed from favorites", "user_id": user.id, "media_id": media.id}


def get_user_favorites(db: Session, user_id: int) -> List[dict]:
    """Get all favorites for a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError(f"User with id {user_id} not found")

    # Use media_to_dict to serialize
    return [media_to_dict(media) for media in user.favorites]
