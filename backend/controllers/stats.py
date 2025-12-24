from sqlalchemy.orm import Session
from models import User, UserMediaList, MediaLike

def get_user_stats(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {
            "stats": {
                "reading_progress": 0,
                "completed": 0,
                "fav_count": 0,
                "followers": 0
            }
        }

    reading_rows = (
        db.query(UserMediaList)
        .filter(UserMediaList.user_id == user_id)
        .all()
    )

    reading_count = len(reading_rows)
    completed_count = sum(
        1 for row in reading_rows if row.completed_at is not None
    )

    fav_count = (
        db.query(MediaLike)
        .filter(MediaLike.user_id == user_id)
        .count()
    )

    return {
        "stats": {
            "reading_progress": reading_count,
            "completed": completed_count,
            "fav_count": fav_count,
            "followers": 0  # placeholder for later
        }
    }
