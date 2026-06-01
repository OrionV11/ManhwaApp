# controllers/media.py

from sqlalchemy.orm import Session
from sqlalchemy import or_
from models import Media
from typing import List, Optional


def media_to_dict(media: Media) -> dict:
    """Convert a Media SQLAlchemy object to a dictionary"""
    return {
        "id": media.id,
        "title_romaji": media.title_romaji,
        "title_english": media.title_english,
        "title_native": media.title_native,
        "type": media.type,
        "format": media.format,
        "status": media.status,
        "description": media.description,
        "start_date": media.start_date.isoformat() if media.start_date else None,
        "end_date": media.end_date.isoformat() if media.end_date else None,
        "chapters": media.chapters,
        "volumes": media.volumes,
        "episodes": media.episodes,
        "cover_image": media.cover_image,
        "banner_image": media.banner_image,
        "genres": media.genres or [],
        "tags": media.tags or [],
        "average_score": float(media.average_score) if media.average_score else None,
        "popularity": media.popularity,
        "favorites": media.favorites,
        "source": media.source,
        "country_of_origin": media.country_of_origin,
        "created_at": media.created_at.isoformat() if media.created_at else None,
        "updated_at": media.updated_at.isoformat() if media.updated_at else None,
    }


def search_media(db: Session, query: str, type: Optional[str] = None, genre: Optional[str] = None) -> List[dict]:
    """Search media by query, optional type and genre"""
    media_query = db.query(Media)

    # Search in titles
    search_filter = or_(
        Media.title_romaji.ilike(f"%{query}%"),
        Media.title_english.ilike(f"%{query}%")
    )
    media_query = media_query.filter(search_filter)

    # Filter by type
    if type:
        media_query = media_query.filter(Media.type == type.upper())

    # Filter by genre
    if genre:
        media_query = media_query.filter(Media.genres.contains([genre]))

    results = media_query.order_by(Media.average_score.desc()).limit(50).all()
    return [media_to_dict(m) for m in results]


def get_trending_media(db: Session, limit: int = 10) -> List[dict]:
    """Get trending media ordered by popularity and score"""
    results = db.query(Media)\
        .order_by(Media.popularity.desc())\
        .limit(limit)\
        .all()
    return [media_to_dict(m) for m in results]


def get_media_by_id(db: Session, media_id: int) -> dict:
    """Get a single media by ID"""
    media_obj = db.query(Media).filter(Media.id == media_id).first()
    if not media_obj:
        raise ValueError(f"Media with id {media_id} not found")
    return media_to_dict(media_obj)
