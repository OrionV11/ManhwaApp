from sqlalchemy.orm import Session
from backend.models import User, UserMediaList, MediaLike, Review

def get_user_stats(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {
            "stats": {
                "reading_progress": 0,
                "completed": 0,
                "fav_count": 0,
                "followers": 0,
                "reviews": 0,
            }
        }

    # Get all user media list entries
    media_list_rows = (
        db.query(UserMediaList)
        .filter(UserMediaList.user_id == user_id)
        .all()
    )

    # Reading = started but not completed
    reading_count = sum(
        1 for row in media_list_rows 
        if row.completed_at is None
    )

    # Completed = has completed_at date
    completed_count = sum(
        1 for row in media_list_rows 
        if row.completed_at is not None
    )

    # Favorites/Likes count
    fav_count = (
        db.query(MediaLike)
        .filter(MediaLike.user_id == user_id)
        .count()
    )

    # Reviews count
    review_count = (
        db.query(Review)
        .filter(Review.user_id == user_id)
        .count()  # More efficient than .all() then len()
    )
    
    return {
        "stats": {
            "reading_progress": reading_count,
            "completed": completed_count,
            "fav_count": fav_count,
            "followers": 0,  # placeholder for later
            "reviews": review_count
        }
    }