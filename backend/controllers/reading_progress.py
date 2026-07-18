from sqlalchemy.orm import Session
from backend.models import User, Media, UserMediaList
from fastapi import HTTPException
from datetime import datetime


def add_user_reading_media(db: Session, user_id: int, media_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    media = db.query(Media).filter(Media.id == media_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    existing_entry = (
        db.query(UserMediaList)
        .filter(UserMediaList.user_id == user_id, UserMediaList.media_id == media_id)
        .first()
    )

    if existing_entry:
        return {"message": "Media already in reading list"}

    new_entry = UserMediaList(user_id=user_id, media_id=media_id, status="READING", progress=0, score=0, notes="")
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)

    return {"message": "Media added to reading list", "entry": new_entry}

# In controllers/reading_progress.py (or similar)

def mark_as_completed(db: Session, user_id: int, media_id: int):
    """Mark a media as completed"""
    media_list = (
        db.query(UserMediaList)
        .filter(
            UserMediaList.user_id == user_id,
            UserMediaList.media_id == media_id
        )
        .first()
    )
    
    if not media_list:
        # If not in list yet, create it as completed
        media_list = UserMediaList(
            user_id=user_id,
            media_id=media_id,
            status="COMPLETED",
            completed_at=datetime.now(),
            started_at=datetime.now()  # Assume they started it
        )
        db.add(media_list)
    else:
        # Update existing entry
        media_list.status = "COMPLETED"
        media_list.completed_at = datetime.now()
        if not media_list.started_at:
            media_list.started_at = datetime.now()
    
    db.commit()
    db.refresh(media_list)
    return {"message": "Marked as completed", "item": media_list}

def get_completed(db: Session, user_id: int):
    """Get all completed media for user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    entries = (
        db.query(UserMediaList)
        .filter(
            UserMediaList.user_id == user_id,
            UserMediaList.completed_at.isnot(None)  # Has completion date
        )
        .all()
    )

    media_ids = [entry.media_id for entry in entries]   
    if not media_ids:
        return []
    media = (
        db.query(Media)
        .filter(Media.id.in_(media_ids))
        .all()
    )

    return media

def get_user_reading_media(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    entries = (
        db.query(UserMediaList)
        .filter(UserMediaList.user_id == user_id,
                UserMediaList.completed_at.is_(None))  
        .all()
    )

    media_ids = [entry.media_id for entry in entries]

    if not media_ids:
        return []

    media = (
        db.query(Media)
        .filter(Media.id.in_(media_ids))
        .all()
    )

    return media
