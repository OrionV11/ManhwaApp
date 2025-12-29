from sqlalchemy.orm import Session
from models import User, UserFollow
from typing import List, Dict
from datetime import datetime

# -------------------------
# Follow Operations
# -------------------------

def follow_user(db: Session, follower_id: int, following_id: int) -> Dict:
    """Follow a user"""
    # Validate users exist
    follower = db.query(User).filter(User.id == follower_id).first()
    following = db.query(User).filter(User.id == following_id).first()
    
    if not follower:
        raise ValueError(f"User with id {follower_id} not found")
    if not following:
        raise ValueError(f"User with id {following_id} not found")
    
    # Check if trying to follow self (though model has constraint)
    if follower_id == following_id:
        raise ValueError("Cannot follow yourself")
    
    # Check if already following
    existing_follow = db.query(UserFollow).filter(
        UserFollow.follower_id == follower_id,
        UserFollow.following_id == following_id
    ).first()
    
    if existing_follow:
        return {
            "message": "Already following this user",
            "follower_id": follower_id,
            "following_id": following_id
        }
    
    # Create follow relationship
    user_follow = UserFollow(
        follower_id=follower_id,
        following_id=following_id
    )
    
    db.add(user_follow)
    db.commit()
    db.refresh(user_follow)
    
    return {
        "message": "Successfully followed user",
        "follower_id": follower_id,
        "following_id": following_id,
        "created_at": user_follow.created_at
    }

def unfollow_user(db: Session, follower_id: int, following_id: int) -> Dict:
    """Unfollow a user"""
    # Validate users exist
    follower = db.query(User).filter(User.id == follower_id).first()
    following = db.query(User).filter(User.id == following_id).first()
    
    if not follower:
        raise ValueError(f"User with id {follower_id} not found")
    if not following:
        raise ValueError(f"User with id {following_id} not found")
    
    # Find the follow relationship
    user_follow = db.query(UserFollow).filter(
        UserFollow.follower_id == follower_id,
        UserFollow.following_id == following_id
    ).first()
    
    if not user_follow:
        return {
            "message": "Not following this user",
            "follower_id": follower_id,
            "following_id": following_id
        }
    
    db.delete(user_follow)
    db.commit()
    
    return {
        "message": "Successfully unfollowed user",
        "follower_id": follower_id,
        "following_id": following_id
    }

# -------------------------
# Follower/Following Queries
# -------------------------

def get_followers(db: Session, user_id: int) -> List[Dict]:
    """Get all followers of a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError(f"User with id {user_id} not found")
    
    # Get all UserFollow records where this user is being followed
    follows = db.query(UserFollow).filter(UserFollow.following_id == user_id).all()
    
    followers_list = []
    for follow in follows:
        follower_user = follow.follower_user
        followers_list.append({
            "user_id": follower_user.id,
            "username": follower_user.username,
            "profile_picture": follower_user.profile_picture,
            "bio": follower_user.bio,
            "followed_at": follow.created_at
        })
    
    return followers_list

def get_following(db: Session, user_id: int) -> List[Dict]:
    """Get all users that a user is following"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError(f"User with id {user_id} not found")
    
    # Get all UserFollow records where this user is the follower
    follows = db.query(UserFollow).filter(UserFollow.follower_id == user_id).all()
    
    following_list = []
    for follow in follows:
        following_user = follow.following_user
        following_list.append({
            "user_id": following_user.id,
            "username": following_user.username,
            "profile_picture": following_user.profile_picture,
            "bio": following_user.bio,
            "followed_at": follow.created_at
        })
    
    return following_list

def get_follower_count(db: Session, user_id: int) -> int:
    """Get the count of followers for a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError(f"User with id {user_id} not found")
    
    return db.query(UserFollow).filter(UserFollow.following_id == user_id).count()

def get_following_count(db: Session, user_id: int) -> int:
    """Get the count of users that a user is following"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError(f"User with id {user_id} not found")
    
    return db.query(UserFollow).filter(UserFollow.follower_id == user_id).count()

def is_following(db: Session, follower_id: int, following_id: int) -> bool:
    """Check if a user is following another user"""
    follow = db.query(UserFollow).filter(
        UserFollow.follower_id == follower_id,
        UserFollow.following_id == following_id
    ).first()
    return follow is not None

def get_user_stats(db: Session, user_id: int) -> Dict:
    """Get follower and following counts for a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError(f"User with id {user_id} not found")
    
    follower_count = get_follower_count(db, user_id)
    following_count = get_following_count(db, user_id)
    
    return {
        "user_id": user_id,
        "username": user.username,
        "follower_count": follower_count,
        "following_count": following_count
    }

def get_mutual_followers(db: Session, user_id: int, other_user_id: int) -> List[Dict]:
    """Get mutual followers between two users (users who follow both)"""
    user = db.query(User).filter(User.id == user_id).first()
    other_user = db.query(User).filter(User.id == other_user_id).first()
    
    if not user:
        raise ValueError(f"User with id {user_id} not found")
    if not other_user:
        raise ValueError(f"User with id {other_user_id} not found")
    
    # Get followers of both users
    user_followers = db.query(UserFollow.follower_id).filter(
        UserFollow.following_id == user_id
    ).all()
    other_followers = db.query(UserFollow.follower_id).filter(
        UserFollow.following_id == other_user_id
    ).all()
    
    # Find intersection
    user_follower_ids = {f[0] for f in user_followers}
    other_follower_ids = {f[0] for f in other_followers}
    mutual_ids = user_follower_ids.intersection(other_follower_ids)
    
    # Get user details for mutual followers
    mutual_users = db.query(User).filter(User.id.in_(mutual_ids)).all()
    
    return [{
        "user_id": u.id,
        "username": u.username,
        "profile_picture": u.profile_picture,
        "bio": u.bio
    } for u in mutual_users]