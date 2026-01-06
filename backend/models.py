from sqlalchemy import Column, Boolean, Integer, String, Text, DateTime, ARRAY, ForeignKey, CheckConstraint, UniqueConstraint, DECIMAL
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

# -------------------------
# Dependent classes first
# -------------------------

class UserFollow(Base):
    __tablename__ = "user_follows"
    
    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    following_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    follower_user = relationship("User", foreign_keys=[follower_id], back_populates="following")
    following_user = relationship("User", foreign_keys=[following_id], back_populates="followers")
    
    __table_args__ = (
        UniqueConstraint('follower_id', 'following_id', name='unique_follow'),
        CheckConstraint('follower_id != following_id', name='no_self_follow'),
    )

class MediaLike(Base):
    __tablename__ = "media_likes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    media_id = Column(Integer, ForeignKey("media.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="likes")
    media = relationship("Media", back_populates="likes")
    
    __table_args__ = (
        UniqueConstraint('user_id', 'media_id', name='unique_user_media_like'),
    )

class Folder(Base):
    __tablename__ = "folders"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_public = Column(Boolean, default=False)
    likes_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="folders")
    items = relationship("FolderItem", back_populates="folder", cascade="all, delete-orphan")


class FolderItem(Base):
    __tablename__ = "folder_items"
    __table_args__ = (
        UniqueConstraint('folder_id', 'media_id', name='unique_folder_media'),
        {'extend_existing': True}
    )
    
    id = Column(Integer, primary_key=True, index=True)
    folder_id = Column(Integer, ForeignKey("folders.id", ondelete="CASCADE"), nullable=False, index=True)
    media_id = Column(Integer, ForeignKey("media.id", ondelete="CASCADE"), nullable=False, index=True)
    added_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text, nullable=True)
    
    # Relationships
    folder = relationship("Folder", back_populates="items")


class Review(Base):
    __tablename__ = "reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    media_id = Column(Integer, ForeignKey("media.id", ondelete="CASCADE"), nullable=False)
    rating = Column(DECIMAL(3, 1))
    title = Column(String(255))
    content = Column(Text, nullable=False)
    likes_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    
    user = relationship("User", back_populates="reviews")
    media = relationship("Media", back_populates="reviews")
    review_likes = relationship("ReviewLike", back_populates="review", cascade="all, delete-orphan")

class ReviewLike(Base):
    __tablename__ = "review_likes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    review_id = Column(Integer, ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    review = relationship("Review", back_populates="review_likes")
    
    __table_args__ = (
        UniqueConstraint('user_id', 'review_id', name='unique_review_like'),
    )

class UserActivity(Base):
    __tablename__ = "user_activity"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    media_id = Column(Integer, ForeignKey("media.id", ondelete="CASCADE"), nullable=False)
    activity_type = Column(String(50), nullable=False)  # STARTED, COMPLETED, UPDATED_PROGRESS, REVIEWED, LIKED
    details = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    user = relationship("User", back_populates="activities")
    media = relationship("Media", back_populates="activities")

# -------------------------
# Media class
# -------------------------

class Media(Base):
    __tablename__ = "media"
    
    id = Column(Integer, primary_key=True, index=True)
    title_romaji = Column(String(255), nullable=False)
    title_english = Column(String(255))
    title_native = Column(String(255))
    type = Column(String(20), nullable=False, index=True)
    format = Column(String(20))
    status = Column(String(20), index=True)
    description = Column(Text)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    chapters = Column(Integer)
    volumes = Column(Integer)
    episodes = Column(Integer)
    cover_image = Column(String(500))
    banner_image = Column(String(500))
    genres = Column(ARRAY(String))
    tags = Column(ARRAY(String))
    average_score = Column(DECIMAL(4, 2), index=True)
    popularity = Column(Integer, default=0, index=True)
    favorites = Column(Integer, default=0)
    source = Column(String(50))
    country_of_origin = Column(String(2))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    
    user_lists = relationship("UserMediaList", back_populates="media", cascade="all, delete-orphan")
    likes = relationship("MediaLike", back_populates="media", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="media", cascade="all, delete-orphan")
    activities = relationship("UserActivity", back_populates="media", cascade="all, delete-orphan")
    
    liked_by = relationship(
        "User",
        secondary="media_likes",
        back_populates="favorites"
    )

# -------------------------
# User class
# -------------------------

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    profile_picture = Column(String(500))
    bio = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    
    media_lists = relationship("UserMediaList", back_populates="user", cascade="all, delete-orphan")
    likes = relationship("MediaLike", back_populates="user", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")
    activities = relationship("UserActivity", back_populates="user", cascade="all, delete-orphan")
    folders = relationship("Folder", back_populates="user", cascade="all, delete-orphan")

    favorites = relationship(
        "Media",
        secondary="media_likes",
        back_populates="liked_by",
        overlaps="likes,media_lists"
    )
    
    followers = relationship(
        "UserFollow",
        foreign_keys="UserFollow.following_id",
        back_populates="following_user",
        cascade="all, delete-orphan"
    )
    
    following = relationship(
        "UserFollow",
        foreign_keys="UserFollow.follower_id",
        back_populates="follower_user",
        cascade="all, delete-orphan"
    )

# -------------------------
# UserMediaList class
# -------------------------

class UserMediaList(Base):
    __tablename__ = "user_media_lists"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    media_id = Column(Integer, ForeignKey("media.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(20), nullable=False, index=True)
    score = Column(DECIMAL(3, 1))
    progress = Column(Integer, default=0)
    notes = Column(Text)
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    
    user = relationship("User", back_populates="media_lists")
    media = relationship("Media", back_populates="user_lists")
    
    __table_args__ = (
        UniqueConstraint('user_id', 'media_id', name='unique_user_media'),
    )
