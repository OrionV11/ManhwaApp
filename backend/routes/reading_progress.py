from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, Media, UserMediaList

router = APIRouter(prefix="/api/reading-progress", tags=["reading-progress"])

@router.put("/{user_id}/add/{media_id}")
def add_reading_progress(user_id: int, media_id: int, db: Session = Depends(get_db)):
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Check if media exists
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found")

    # Check if entry already exists
    progress_entry = db.query(UserMediaList).filter(
        UserMediaList.user_id == user_id,
        UserMediaList.media_id == media_id
    ).first()

    if progress_entry:
        # If already exists, increment progress by 1 (or modify as needed)
        progress_entry.progress += 1
        db.commit()
        db.refresh(progress_entry)
        return {"message": "Progress updated", "progress": progress_entry.progress}
    else:
        # Create new entry
        new_entry = UserMediaList(
            user_id=user_id,
            media_id=media_id,
            status="READING",
            progress=1
        )
        db.add(new_entry)
        db.commit()
        db.refresh(new_entry)
        return {"message": "Reading progress started", "progress": new_entry.progress}


@router.get("/{user_id}")
def get_reading_progress(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    progress_list = db.query(UserMediaList).filter(UserMediaList.user_id == user_id).all()
    return [
        {
            "media_id": entry.media_id,
            "status": entry.status,
            "progress": entry.progress,
            "score": float(entry.score) if entry.score else None,
            "notes": entry.notes
        } for entry in progress_list
    ]
