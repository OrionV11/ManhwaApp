from sqlalchemy.orm import Session
from models import User, Media, UserMediaList
from fastapi import HTTPException

def add_reading_progress(db: Session, user_id: int, media_id: int, progress: int = 1) -> dict:
    """
    Add or update reading progress for a user's media.
    If no entry exists in UserMediaList, create one.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")

    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail=f"Media {media_id} not found")

    # Check if user already has this media in their list
    user_media = db.query(UserMediaList).filter_by(user_id=user_id, media_id=media_id).first()

    if user_media:
        user_media.progress += progress
    else:
        user_media = UserMediaList(
            user_id=user_id,
            media_id=media_id,
            status="READING",
            progress=progress
        )
        db.add(user_media)

    db.commit()
    db.refresh(user_media)

    return {
        "user_id": user_id,
        "media_id": media_id,
        "progress": user_media.progress,
        "status": user_media.status
    }
