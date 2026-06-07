# backend/routes/users.py or backend/main.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from models import User, UserFollow, Review, MediaLike, Media, Folder, FolderItem
from dependencies import get_current_user_id, get_optional_current_user_id

from logger import api_logger, error_logger

router = APIRouter()

@router.get("/users/search")
async def search_users(
    q: str,
    current_user_id: Optional[int] = Depends(get_optional_current_user_id),
    db: Session = Depends(get_db)
):
    """Search for users by username - public endpoint"""
    
    if not q or len(q.strip()) < 2:
        return []
    
    # Search users by username (case-insensitive)
    users = db.query(User).filter(
        User.username.ilike(f"%{q}%")
    ).limit(20).all()
    
    results = []
    for user in users:
        # Count followers/following
        followers_count = db.query(UserFollow).filter(
            UserFollow.following_id == user.id
        ).count()
        
        following_count = db.query(UserFollow).filter(
            UserFollow.follower_id == user.id
        ).count()
        
        results.append({
            "id": user.id,
            "username": user.username,
            "bio": user.bio,
            "profile_picture": user.profile_picture,
            "followers_count": followers_count,
            "following_count": following_count,
        })
    
    return results

@router.get("/users/me/settings")
async def get_my_settings(
    current_user_id: int = Depends(get_current_user_id)
):
    """Get current user's settings"""
    return {
        "user_id": current_user_id,
        "notifications_enabled": True,
        "is_private": False,
    }

@router.get("/users/{user_id}/followers")
async def get_user_followers(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get list of user's followers"""
    
    follows = db.query(UserFollow).filter(
        UserFollow.following_id == user_id
    ).all()
    
    followers = []
    for follow in follows:
        follower = db.query(User).filter(User.id == follow.follower_id).first()
        if follower:
            followers.append({
                "id": follower.id,
                "username": follower.username,
                "bio": follower.bio,
                "profile_picture": follower.profile_picture,
            })
    
    return followers


@router.get("/users/{user_id}/following")
async def get_user_following(
    user_id: int,
    db: Session = Depends(get_db)
):

    follows = db.query(UserFollow).filter(
        UserFollow.follower_id == user_id
    ).all()

    following = []
    for follow in follows:
        user = db.query(User).filter(User.id == follow.following_id).first()
        if user:
            following.append({
                "id": user.id,
                "username": user.username,
                "bio": user.bio,
                "profile_picture": user.profile_picture,
            })
    
    return following

@router.put("/users/me/settings")
async def update_my_settings(
    settings: dict,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update current user's settings"""
    # Update user settings in database
    # For now, just return success
    return {"message": "Settings updated"}

@router.get("/users/{user_id}/favorites")
async def get_user_favorites(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get user's public favorites"""
    
    # Get user's liked media
    likes = db.query(MediaLike).filter(
        MediaLike.user_id == user_id
    ).all()
    
    favorites = []
    for like in likes:
        media = db.query(Media).filter(Media.id == like.media_id).first()
        if media:
            favorites.append({
                "id": media.id,
                "title_english": media.title_english,
                "title_romaji": media.title_romaji,
                "cover_image": media.cover_image,
                "type": media.type,
                "average_score": float(media.average_score) if media.average_score else None,
            })
    
    return favorites

@router.get("/users/{user_id}/reviews")
async def get_user_reviews(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get user's public reviews"""
    
    reviews = db.query(Review).filter(
        Review.user_id == user_id
    ).order_by(Review.created_at.desc()).all()
    
    result = []
    for review in reviews:
        media = db.query(Media).filter(Media.id == review.media_id).first()
        result.append({
            "id": review.id,
            "rating": float(review.rating) if review.rating else None,
            "title": review.title,
            "content": review.content,
            "created_at": review.created_at.isoformat(),
            "media": {
                "id": media.id,
                "title_english": media.title_english,
                "title_romaji": media.title_romaji,
                "cover_image": media.cover_image,
            } if media else None,
        })
    
    return result

@router.delete("/users/me")
async def delete_my_account(
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Delete current user's account"""
    user = db.query(User).filter(User.id == current_user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    api_logger.info(f"Accound deleted | user={current_user_id}")
    return {"message": "Account deleted successfully"}

# backend/routes/users.py


@router.get("/users/{user_id}/folders")
async def get_user_folders(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get user's public folders"""
    
    # Only get public folders for other users
    folders = db.query(Folder).filter(
        Folder.user_id == user_id,
        Folder.is_public == True  # Only public folders
    ).order_by(Folder.created_at.desc()).all()
    
    result = []
    for folder in folders:
        # Get item count
        item_count = db.query(FolderItem).filter(
            FolderItem.folder_id == folder.id
        ).count()
        
        # Get preview images (first 4 items)
        items = db.query(FolderItem).filter(
            FolderItem.folder_id == folder.id
        ).limit(4).all()
        
        preview_images = []
        for item in items:
            media = db.query(Media).filter(Media.id == item.media_id).first()
            if media and media.cover_image:
                preview_images.append(media.cover_image)
        
        result.append({
            "id": folder.id,
            "title": folder.title,
            "description": folder.description,
            "is_public": folder.is_public,
            "likes_count": folder.likes_count,
            "item_count": item_count,
            "created_at": folder.created_at.isoformat(),
            "preview_images": preview_images,
        })
    
    return result


# Update the profile endpoint to include folders_count
@router.get("/users/{user_id}/profile")
async def get_user_profile(
    user_id: int,
    current_user_id: Optional[int] = Depends(get_optional_current_user_id),
    db: Session = Depends(get_db)
):
    """Get user profile with stats"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    followers_count = db.query(UserFollow).filter(
        UserFollow.following_id == user_id
    ).count()
    
    following_count = db.query(UserFollow).filter(
        UserFollow.follower_id == user_id
    ).count()
    
    reviews_count = db.query(Review).filter(
        Review.user_id == user_id
    ).count()
    
    favorites_count = db.query(MediaLike).filter(
        MediaLike.user_id == user_id
    ).count()
    
    folders_count = db.query(Folder).filter(
        Folder.user_id == user_id,
        Folder.is_public == True
    ).count()
    
    is_following = False
    if current_user_id and current_user_id != user_id:
        follow = db.query(UserFollow).filter(
            UserFollow.follower_id == current_user_id,
            UserFollow.following_id == user_id
        ).first()
        is_following = follow is not None
    
    return {
        "id": user.id,
        "username": user.username,
        "bio": user.bio,
        "profile_picture": user.profile_picture,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
        "stats": {
            "followers_count": followers_count,
            "following_count": following_count,
            "reviews_count": reviews_count,
            "favorites_count": favorites_count,
            "folders_count": folders_count,  
        },
        "is_following": is_following if current_user_id else None,
    }

@router.post("/users/{user_id}/follow")
async def follow_user(
    user_id: int,
    current_user_id: int = Depends(get_current_user_id), 
    db: Session = Depends(get_db)
):
    """Follow a user"""
    
    if current_user_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already following
    existing = db.query(UserFollow).filter(
        UserFollow.follower_id == current_user_id,
        UserFollow.following_id == user_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already following this user")
    
    # Create follow
    follow = UserFollow(
        follower_id=current_user_id,
        following_id=user_id
    )
    db.add(follow)
    db.commit()
    api_logger.info(f"User followed | follower={current_user_id} | following={user_id}")
    return {"message": "Successfully followed user"}


@router.delete("/users/{user_id}/follow")
async def unfollow_user(
    user_id: int,
    current_user_id: int = Depends(get_current_user_id), 
    db: Session = Depends(get_db)
):
    """Unfollow a user"""
    
    # Find follow relationship
    follow = db.query(UserFollow).filter(
        UserFollow.follower_id == current_user_id,
        UserFollow.following_id == user_id
    ).first()
    
    if not follow:
        raise HTTPException(status_code=404, detail="Not following this user")
    
    db.delete(follow)
    db.commit()
    api_logger.info(f"User unfollowed | follower={current_user_id} | following={user_id}")
    return {"message": "Successfully unfollowed user"}
