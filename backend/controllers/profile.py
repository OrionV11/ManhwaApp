from sqlalchemy.orm import Session
from database import SessionLocal
from backend.models import User
from dependencies import get_current_user_id

def update_profile(user_id, username=None, bio=None, profile_picture=None):
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        if username and username != user.username:
            existing = db.query(User).filter(User.username == username).first()
            if existing:
                raise ValueError("Username already taken")
            user.username = username

        if bio is not None:
            user.bio = bio

        if profile_picture is not None:
            user.profile_picture = profile_picture

        db.commit()
        db.refresh(user)

        return {
            "message": "Profile updated successfully",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "bio": user.bio,
                "profile_picture": user.profile_picture,
            }
        }

    finally:
        db.close()
