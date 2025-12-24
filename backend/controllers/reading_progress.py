from sqlalchemy.orm import Session
from models import User, Media, UserMediaList
from fastapi import HTTPException


def get_user_reading_media(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    entries = (
        db.query(UserMediaList)
        .filter(UserMediaList.user_id == user_id)
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
