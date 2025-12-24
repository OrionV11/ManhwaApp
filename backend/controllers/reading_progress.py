from sqlalchemy.orm import Session
from models import User, Media, UserMediaList
from fastapi import HTTPException


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
