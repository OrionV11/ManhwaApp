from sqlalchemy.orm import Session
from backend.models import User, Media, UserActivity
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from controllers.media import media_to_dict

# -------------------------
# Activity Operations
# -------------------------

def create_activity(
    db: Session,
    user_id: int,
    media_id: int,
    activity_type: str,
    details: Optional[str] = None
) -> Dict:
    """Create a new activity entry"""
    user = db.query(User).filter(User.id == user_id).first()
    media = db.query(Media).filter(Media.id == media_id).first()
    
    if not user:
        raise ValueError(f"User with id {user_id} not found")
    if not media:
        raise ValueError(f"Media with id {media_id} not found")
    
    valid_types = ["STARTED", "COMPLETED", "UPDATED_PROGRESS", "REVIEWED", "LIKED", "ADDED"]
    if activity_type not in valid_types:
        raise ValueError(f"Invalid activity type. Must be one of: {', '.join(valid_types)}")
    
    activity = UserActivity(
        user_id=user_id,
        media_id=media_id,
        activity_type=activity_type,
        details=details
    )
    
    db.add(activity)
    db.commit()
    db.refresh(activity)
    
    return {
        "activity_id": activity.id,
        "user_id": user_id,
        "media_id": media_id,
        "activity_type": activity_type,
        "details": details,
        "created_at": activity.created_at
    }

def get_user_activities(
    db: Session,
    user_id: int,
    limit: int = 50,
    activity_type: Optional[str] = None
) -> List[Dict]:
    """Get activities for a specific user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError(f"User with id {user_id} not found")
    
    query = db.query(UserActivity).filter(UserActivity.user_id == user_id)
    
    if activity_type:
        query = query.filter(UserActivity.activity_type == activity_type)
    
    activities = query.order_by(UserActivity.created_at.desc()).limit(limit).all()
    
    result = []
    for activity in activities:
        activity_dict = {
            "activity_id": activity.id,
            "user_id": activity.user_id,
            "activity_type": activity.activity_type,
            "details": activity.details,
            "created_at": activity.created_at
        }
        
        if activity.media:
            activity_dict["media"] = {
                "id": activity.media.id,
                "title_romaji": activity.media.title_romaji,
                "title_english": activity.media.title_english,
                "cover_image": activity.media.cover_image,
                "type": activity.media.type
            }
        
        result.append(activity_dict)
    
    return result

def get_following_feed(
    db: Session,
    user_id: int,
    limit: int = 50
) -> List[Dict]:
    """Get activity feed from users that the current user follows"""
    from backend.models import UserFollow
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError(f"User with id {user_id} not found")
    
    # Get list of users this user is following
    following_ids = db.query(UserFollow.following_id).filter(
        UserFollow.follower_id == user_id
    ).all()
    following_ids = [fid[0] for fid in following_ids]
    
    if not following_ids:
        return []
    
    # Get activities from followed users
    activities = db.query(UserActivity).filter(
        UserActivity.user_id.in_(following_ids)
    ).order_by(UserActivity.created_at.desc()).limit(limit).all()
    
    result = []
    for activity in activities:
        activity_dict = {
            "activity_id": activity.id,
            "user": {
                "id": activity.user.id,
                "username": activity.user.username,
                "profile_picture": activity.user.profile_picture
            },
            "activity_type": activity.activity_type,
            "details": activity.details,
            "created_at": activity.created_at
        }
        
        if activity.media:
            activity_dict["media"] = {
                "id": activity.media.id,
                "title_romaji": activity.media.title_romaji,
                "title_english": activity.media.title_english,
                "cover_image": activity.media.cover_image,
                "type": activity.media.type
            }
        
        result.append(activity_dict)
    
    return result

def get_global_activity_feed(
    db: Session,
    limit: int = 50,
    activity_type: Optional[str] = None
) -> List[Dict]:
    """Get global activity feed from all users"""
    query = db.query(UserActivity)
    
    if activity_type:
        query = query.filter(UserActivity.activity_type == activity_type)
    
    activities = query.order_by(UserActivity.created_at.desc()).limit(limit).all()
    
    result = []
    for activity in activities:
        activity_dict = {
            "activity_id": activity.id,
            "user": {
                "id": activity.user.id,
                "username": activity.user.username,
                "profile_picture": activity.user.profile_picture
            },
            "activity_type": activity.activity_type,
            "details": activity.details,
            "created_at": activity.created_at
        }
        
        if activity.media:
            activity_dict["media"] = {
                "id": activity.media.id,
                "title_romaji": activity.media.title_romaji,
                "title_english": activity.media.title_english,
                "cover_image": activity.media.cover_image,
                "type": activity.media.type
            }
        
        result.append(activity_dict)
    
    return result

def get_media_activities(
    db: Session,
    media_id: int,
    limit: int = 50
) -> List[Dict]:
    """Get all activities for a specific media"""
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise ValueError(f"Media with id {media_id} not found")
    
    activities = db.query(UserActivity).filter(
        UserActivity.media_id == media_id
    ).order_by(UserActivity.created_at.desc()).limit(limit).all()
    
    result = []
    for activity in activities:
        result.append({
            "activity_id": activity.id,
            "user": {
                "id": activity.user.id,
                "username": activity.user.username,
                "profile_picture": activity.user.profile_picture
            },
            "activity_type": activity.activity_type,
            "details": activity.details,
            "created_at": activity.created_at
        })
    
    return result

def delete_activity(db: Session, activity_id: int, user_id: int) -> Dict:
    """Delete an activity (only by the user who created it)"""
    activity = db.query(UserActivity).filter(UserActivity.id == activity_id).first()
    
    if not activity:
        raise ValueError(f"Activity with id {activity_id} not found")
    
    if activity.user_id != user_id:
        raise ValueError("You can only delete your own activities")
    
    db.delete(activity)
    db.commit()
    
    return {"message": "Activity deleted", "activity_id": activity_id}