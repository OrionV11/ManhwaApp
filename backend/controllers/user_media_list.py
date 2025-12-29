from sqlalchemy.orm import Session
from models import User, Media, UserMediaList, UserActivity
from typing import List, Dict, Optional
from datetime import datetime
from controllers.media import media_to_dict

# -------------------------
# User Media List Operations
# -------------------------

def add_media_to_list(
    db: Session,
    user_id: int,
    media_id: int,
    status: str,
    score: Optional[float] = None,
    progress: int = 0,
    notes: Optional[str] = None
) -> Dict:
    """Add a media to user's list"""
    user = db.query(User).filter(User.id == user_id).first()
    media = db.query(Media).filter(Media.id == media_id).first()
    
    if not user:
        raise ValueError(f"User with id {user_id} not found")
    if not media:
        raise ValueError(f"Media with id {media_id} not found")
    
    # Valid statuses
    valid_statuses = ["WATCHING", "COMPLETED", "ON_HOLD", "DROPPED", "PLAN_TO_WATCH"]
    if status not in valid_statuses:
        raise ValueError(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
    
    # Check if already exists
    existing_entry = db.query(UserMediaList).filter(
        UserMediaList.user_id == user_id,
        UserMediaList.media_id == media_id
    ).first()
    
    if existing_entry:
        raise ValueError("Media already in user's list")
    
    # Create list entry
    list_entry = UserMediaList(
        user_id=user_id,
        media_id=media_id,
        status=status,
        score=score,
        progress=progress,
        notes=notes,
        started_at=datetime.now() if status == "WATCHING" else None
    )
    
    db.add(list_entry)
    
    # Create activity
    activity = UserActivity(
        user_id=user_id,
        media_id=media_id,
        activity_type="STARTED" if status == "WATCHING" else "ADDED",
        details=f"Added {media.title_romaji} to {status}"
    )
    db.add(activity)
    
    db.commit()
    db.refresh(list_entry)
    
    return {
        "message": "Media added to list",
        "entry_id": list_entry.id,
        "user_id": user_id,
        "media_id": media_id,
        "status": status,
        "score": score,
        "progress": progress
    }

def update_media_in_list(
    db: Session,
    entry_id: int,
    user_id: int,
    status: Optional[str] = None,
    score: Optional[float] = None,
    progress: Optional[int] = None,
    notes: Optional[str] = None
) -> Dict:
    """Update a media entry in user's list"""
    entry = db.query(UserMediaList).filter(UserMediaList.id == entry_id).first()
    
    if not entry:
        raise ValueError(f"List entry with id {entry_id} not found")
    
    if entry.user_id != user_id:
        raise ValueError("You can only update your own list entries")
    
    old_status = entry.status
    old_progress = entry.progress
    
    # Update fields
    if status is not None:
        valid_statuses = ["WATCHING", "COMPLETED", "ON_HOLD", "DROPPED", "PLAN_TO_WATCH"]
        if status not in valid_statuses:
            raise ValueError(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
        entry.status = status
        
        if status == "COMPLETED" and not entry.completed_at:
            entry.completed_at = datetime.now()
        elif status == "WATCHING" and not entry.started_at:
            entry.started_at = datetime.now()
    
    if score is not None:
        if score < 0 or score > 10:
            raise ValueError("Score must be between 0 and 10")
        entry.score = score
    
    if progress is not None:
        entry.progress = progress
    
    if notes is not None:
        entry.notes = notes
    
    # Create activity for significant changes
    if status and status != old_status:
        if status == "COMPLETED":
            activity = UserActivity(
                user_id=user_id,
                media_id=entry.media_id,
                activity_type="COMPLETED",
                details=f"Completed {entry.media.title_romaji}"
            )
            db.add(activity)
    
    if progress is not None and progress != old_progress:
        activity = UserActivity(
            user_id=user_id,
            media_id=entry.media_id,
            activity_type="UPDATED_PROGRESS",
            details=f"Progress: {progress}"
        )
        db.add(activity)
    
    db.commit()
    db.refresh(entry)
    
    return {
        "message": "List entry updated",
        "entry_id": entry.id,
        "status": entry.status,
        "score": entry.score,
        "progress": entry.progress,
        "notes": entry.notes,
        "updated_at": entry.updated_at
    }

def remove_media_from_list(db: Session, entry_id: int, user_id: int) -> Dict:
    """Remove a media from user's list"""
    entry = db.query(UserMediaList).filter(UserMediaList.id == entry_id).first()
    
    if not entry:
        raise ValueError(f"List entry with id {entry_id} not found")
    
    if entry.user_id != user_id:
        raise ValueError("You can only remove your own list entries")
    
    media_title = entry.media.title_romaji if entry.media else "Unknown"
    
    db.delete(entry)
    db.commit()
    
    return {
        "message": "Media removed from list",
        "entry_id": entry_id,
        "media_title": media_title
    }

def get_user_media_list(
    db: Session,
    user_id: int,
    status: Optional[str] = None
) -> List[Dict]:
    """Get user's media list, optionally filtered by status"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError(f"User with id {user_id} not found")
    
    query = db.query(UserMediaList).filter(UserMediaList.user_id == user_id)
    
    if status:
        query = query.filter(UserMediaList.status == status)
    
    entries = query.all()
    
    result = []
    for entry in entries:
        entry_dict = {
            "entry_id": entry.id,
            "status": entry.status,
            "score": entry.score,
            "progress": entry.progress,
            "notes": entry.notes,
            "started_at": entry.started_at,
            "completed_at": entry.completed_at,
            "created_at": entry.created_at,
            "updated_at": entry.updated_at
        }
        
        if entry.media:
            entry_dict["media"] = media_to_dict(entry.media)
        
        result.append(entry_dict)
    
    return result

def get_media_list_entry(db: Session, user_id: int, media_id: int) -> Optional[Dict]:
    """Get a specific media entry from user's list"""
    entry = db.query(UserMediaList).filter(
        UserMediaList.user_id == user_id,
        UserMediaList.media_id == media_id
    ).first()
    
    if not entry:
        return None
    
    return {
        "entry_id": entry.id,
        "status": entry.status,
        "score": entry.score,
        "progress": entry.progress,
        "notes": entry.notes,
        "started_at": entry.started_at,
        "completed_at": entry.completed_at,
        "created_at": entry.created_at,
        "updated_at": entry.updated_at,
        "media": media_to_dict(entry.media) if entry.media else None
    }

def get_list_statistics(db: Session, user_id: int) -> Dict:
    """Get statistics about user's media list"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError(f"User with id {user_id} not found")
    
    entries = db.query(UserMediaList).filter(UserMediaList.user_id == user_id).all()
    
    stats = {
        "total_entries": len(entries),
        "watching": 0,
        "completed": 0,
        "on_hold": 0,
        "dropped": 0,
        "plan_to_watch": 0,
        "total_episodes_watched": 0,
        "total_chapters_read": 0,
        "mean_score": 0
    }
    
    scored_entries = []
    
    for entry in entries:
        stats[entry.status.lower()] = stats.get(entry.status.lower(), 0) + 1
        stats["total_episodes_watched"] += entry.progress or 0
        
        if entry.score:
            scored_entries.append(entry.score)
    
    if scored_entries:
        stats["mean_score"] = round(sum(scored_entries) / len(scored_entries), 2)
    
    return stats